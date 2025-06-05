package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"log/slog"
	"net/http"
	"time"

	"github.com/jellydator/ttlcache/v3"
	"github.com/vorticalbox/byofe/database"
	"github.com/vorticalbox/byofe/event"
	"golang.org/x/crypto/bcrypt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Timestamp = time.Time

type ctxKey string

const UserCtxKey ctxKey = "User"

type UserAttempts struct {
	LoginAttempts int32     `json:"loginAttempts" bson:"loginAttempts"`
	LastAttempt   Timestamp `json:"lastAttempt" bson:"lastAttempt"`
}

type UserDocument struct {
	ID        primitive.ObjectID `json:"_id" bson:"_id"`
	UserName  string             `json:"username" bson:"username"`
	Password  string             `json:"password,omitempty" bson:"password"`
	CreatedAt Timestamp          `json:"createdAt" bson:"createdAt"`
}

type SessionDocument struct {
	ID        primitive.ObjectID `json:"_id" bson:"_id"`
	UserID    primitive.ObjectID `json:"userId" bson:"userId"`
	ApiKey    string             `json:"apiKey" bson:"apiKey"`
	ExpiresAt Timestamp          `json:"expiresAt" bson:"expiresAt"`
	EventID   primitive.ObjectID `json:"eventId,omitempty" bson:"eventId,omitempty"`
}

type AuthService struct {
	client       *mongo.Client
	database     *mongo.Database
	collection   *mongo.Collection
	log          *slog.Logger
	cache        *ttlcache.Cache[string, UserDocument]
	eventService event.EventService
}

func NewAuthService(db *database.DatabaseConnection, log *slog.Logger) AuthService {
	cache := ttlcache.New(
		ttlcache.WithTTL[string, UserDocument](time.Minute),
	)
	go cache.Start()
	eventService := event.NewEventService(db.Client, db.Database)
	return AuthService{
		client:       db.Client,
		database:     db.Database,
		collection:   db.Database.Collection("users"),
		log:          log,
		cache:        cache,
		eventService: eventService,
	}
}

func (authService AuthService) FindUserByApiKey(ctx context.Context, apiKey string) (UserDocument, error) {
	if authService.cache.Has(apiKey) {
		authService.log.Debug("Cache hit for API key", slog.String("apiKey", apiKey))
		user := authService.cache.Get(apiKey)
		return user.Value(), nil
	}
	sessionCollection := authService.database.Collection("sessions")
	filter := bson.M{"apiKey": apiKey}
	var session SessionDocument
	err := sessionCollection.FindOne(ctx, filter).Decode(&session)
	if err != nil {
		return UserDocument{}, err
	}
	userCollection := authService.database.Collection("users")
	var user UserDocument
	filter = bson.M{"_id": session.UserID}
	err = userCollection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		return UserDocument{}, err
	}
	authService.cache.Set(apiKey, user, ttlcache.DefaultTTL)
	return user, nil
}

func (authService AuthService) Middleware(next http.Handler) http.Handler {
	return WrapHandler(func(w http.ResponseWriter, r *http.Request) error {
		ctx := r.Context()
		apiToken := r.Header.Get("x-access-token")
		if apiToken == "" {
			return &ApiError{
				Status: http.StatusUnauthorized,
				Msg:    "API token is required",
			}
		}
		authService.log.Debug("Middleware: checking API token", slog.String("apiToken", apiToken))
		user, err := authService.FindUserByApiKey(ctx, apiToken)
		if err != nil {
			return &ApiError{
				Status: http.StatusUnauthorized,
				Msg:    "Invalid API token",
			}
		}
		ctx = context.WithValue(r.Context(), UserCtxKey, &user)
		next.ServeHTTP(w, r.WithContext(ctx))
		return nil
	}, authService.log)
}

// @Summary		current user
// @Description	returns the currently logged in user
// @Tags			user
// @Accept			application/json
// @Security		WithToken
// @Produce		application/json
// @Success		200	{object}	UserDocument
// @Failure		500	{object}	ApiError
// @Failure		401	{object}	ApiError
// @Router			/current-user [get]
func (authService AuthService) CurrentUser() http.HandlerFunc {
	return WrapHandler(func(w http.ResponseWriter, r *http.Request) error {
		ctx := r.Context()
		authService.log.Debug("Getting current user")
		if data, ok := ctx.Value(UserCtxKey).(*UserDocument); ok {
			data.Password = ""
			return JsonResponse(w, http.StatusOK, data)
		}
		return &ApiError{
			Status: http.StatusInternalServerError,
			Msg:    "Failed to get user current user",
		}

	}, authService.log)
}

type LoginDTO struct {
	UserName string `json:"username" validate:"required,min=3,max=32"`
	Password string `json:"password" validate:"required,min=8,max=64"`
}

// @Summary		login
// @Description	logs in a user and returns an API token
// @Tags			user
// @Accept			application/json
// @Produce		application/json
// @Param			LoginDTO	body	LoginDTO	true	"Login credentials"
// @Success		200	{object}	SessionDocument
// @Failure		500	{object}	ApiError
// @Failure		401	{object}	ApiError
// @Router			/login [post]
func (authService AuthService) Login() http.HandlerFunc {
	return WrapHandler(func(w http.ResponseWriter, r *http.Request) error {
		ctx := r.Context()
		var loginDTO LoginDTO
		if err := DecodeJSONBody(r, &loginDTO); err != nil {
			return err
		}
		authService.log.Debug("Login attempt", slog.String("username", loginDTO.UserName))
		userCollection := authService.database.Collection("users")
		filter := bson.M{"username": loginDTO.UserName}
		var user UserDocument
		err := userCollection.FindOne(ctx, filter).Decode(&user)
		if err != nil {
			return &ApiError{
				Status: http.StatusUnauthorized,
				Msg:    "User not found",
			}
		}
		if !Check(loginDTO.Password, user.Password) {
			return &ApiError{
				Status: http.StatusUnauthorized,
				Msg:    "Invalid password",
			}
		}
		apiKey, err := generateApiKey(16) // Implement this function to generate a unique API key
		if err != nil {
			return &ApiError{
				Status: http.StatusInternalServerError,
				Msg:    "Failed to generate API key: " + err.Error(),
			}
		}
		session := SessionDocument{
			ID:        primitive.NewObjectID(),
			UserID:    user.ID,
			ApiKey:    "byofe_" + apiKey,              // Implement this function to generate a unique API key
			ExpiresAt: time.Now().Add(24 * time.Hour), // Set expiration as needed
		}
		mongoSession, err := authService.client.StartSession()
		if err != nil {
			log.Fatal(err)
		}
		defer mongoSession.EndSession(ctx)
		sessionCollection := authService.database.Collection("sessions")
		_, err = mongoSession.WithTransaction(ctx, func(sessionCtx mongo.SessionContext) (any, error) {
			event, err := authService.eventService.CreateEvent(sessionCtx, event.EventOts{
				UserID:      user.ID,
				Description: "User logged in",
				Tags:        []string{"login"},
			})
			if err != nil {
				return nil, &ApiError{
					Status: http.StatusInternalServerError,
					Msg:    "Failed to create event: " + err.Error(),
				}
			}
			session.EventID = event
			// delete all previous sessions for this user
			_, err = sessionCollection.DeleteMany(sessionCtx, bson.M{"userId": user.ID})
			if err != nil {
				return nil, &ApiError{
					Status: http.StatusInternalServerError,
					Msg:    "Failed to delete previous sessions: " + err.Error(),
				}
			}
			if _, err := sessionCollection.InsertOne(sessionCtx, session); err != nil {
				return nil, &ApiError{
					Status: http.StatusInternalServerError,
					Msg:    "Failed to create session" + err.Error(),
				}
			}
			return nil, nil
		})
		if err != nil {
			return &ApiError{
				Status: http.StatusInternalServerError,
				Msg:    "Failed to login: " + err.Error(),
			}
		}
		return JsonResponse(w, http.StatusOK, session)
	}, authService.log)
}

func generateApiKey(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

type RegisterUserDTO struct {
	UserName string `json:"username" validate:"required,min=3,max=32,alphanum"`
	Password string `json:"password" validate:"required,min=8,max=64"`
}

// @Summary		register user
// @Description	registers a new user
// @Tags			user
// @Accept			application/json
// @Produce		application/json
// @Param			RegisterUserDTO	body	RegisterUserDTO	true	"User registration details"
// @Success		200	{object}	UserDocument
// @Failure		500	{object}	ApiError
// @Failure		400	{object}	ApiError
// @Router			/register [post]
func (authService AuthService) Register() http.HandlerFunc {
	return WrapHandler(func(w http.ResponseWriter, r *http.Request) error {
		ctx := r.Context()
		var registerDTO RegisterUserDTO
		if err := DecodeJSONBody(r, &registerDTO); err != nil {
			return err
		}
		userCollection := authService.database.Collection("users")
		existingUser := UserDocument{}
		filter := bson.M{"username": registerDTO.UserName}
		err := userCollection.FindOne(ctx, filter).Decode(&existingUser)
		if err != mongo.ErrNoDocuments {
			return &ApiError{
				Status: http.StatusBadRequest,
				Msg:    "Username already exists",
			}
		}
		hashedPassword, err := Hash(registerDTO.Password)
		if err != nil {
			return &ApiError{
				Status: http.StatusInternalServerError,
				Msg:    "Failed to hash password: " + err.Error(),
			}
		}
		newUser := UserDocument{
			ID:        primitive.NewObjectID(),
			UserName:  registerDTO.UserName,
			Password:  hashedPassword,
			CreatedAt: time.Now(),
		}
		if _, err := userCollection.InsertOne(ctx, newUser); err != nil {
			return &ApiError{
				Status: http.StatusInternalServerError,
				Msg:    "Failed to create user",
			}
		}
		newUser.Password = "" // Don't return the password hash
		return JsonResponse(w, http.StatusOK, newUser)
	}, authService.log)
}

// Hash generates a hash for the given password or an error
func Hash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// Check confirms if the given password matches the stored hash.
func Check(password string, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
