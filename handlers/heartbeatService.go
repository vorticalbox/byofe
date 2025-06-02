package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/vorticalbox/byofe/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type HeartbeatDTO struct {
	IsAlive bool `json:"is_alive"`
}

type HeartbeatService struct {
	client   *mongo.Client
	database *mongo.Database
	log      *slog.Logger
}

func NewHeartbeatService(db *database.DatabaseConnection, log *slog.Logger) HeartbeatService {
	return HeartbeatService{
		client:   db.Client,
		database: db.Database,
		log:      log,
	}
}

// @Summary		Show the status of server.
// @Description	get the status of server.
// @Tags			health
// @Accept			*/*
// @Produce		application/json
// @Success		200	{object}	HeartbeatDTO
// @Failure		500	{object}	ApiError
// @BasePath		/heartbeat
// @Router			/heartbeat [get]
func (heartbeatService HeartbeatService) HeartBeat() http.HandlerFunc {
	return WrapHandler(func(w http.ResponseWriter, r *http.Request) error {
		ctx, cancel := context.WithTimeout(r.Context(), 1*time.Second)
		defer cancel()
		var result bson.M
		if err := heartbeatService.database.RunCommand(ctx, bson.D{{Key: "ping", Value: 1}}).Decode(&result); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return &ApiError{
				Status: http.StatusInternalServerError,
				Msg:    "Database is not available",
			}
		}
		data := HeartbeatDTO{IsAlive: true}
		return JsonResponse(w, http.StatusOK, data)
	}, heartbeatService.log)
}
