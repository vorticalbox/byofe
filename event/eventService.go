package event

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type EventService struct {
	client     *mongo.Client
	database   *mongo.Database
	collection *mongo.Collection
}
type Timestamp = time.Time
type EventDocument struct {
	ID          primitive.ObjectID `json:"_id" bson:"_id"`
	UserID      primitive.ObjectID `json:"userId" bson:"userId"`
	Description string             `json:"description,omitempty" bson:"description"`
	Tags        []string           `json:"tags,omitempty" bson:"tags"`
	CreatedAt   Timestamp          `json:"created" bson:"created"`
}

func NewEventService(client *mongo.Client, database *mongo.Database) EventService {
	collection := database.Collection("events")
	return EventService{
		client:     client,
		database:   database,
		collection: collection,
	}
}

type EventOts struct {
	UserID      primitive.ObjectID `json:"userId" bson:"userId"`
	Description string             `json:"description,omitempty" bson:"description"`
	Tags        []string           `json:"tags,omitempty" bson:"tags"`
}

func (eventService EventService) CreateEvent(sessionCtx mongo.SessionContext, otps EventOts) (primitive.ObjectID, error) {
	eventID := primitive.NewObjectID()
	EventDocument := EventDocument{
		ID:          eventID,
		Description: otps.Description,
		Tags:        otps.Tags,
		UserID:      otps.UserID,
	}
	_, err := eventService.collection.InsertOne(sessionCtx, EventDocument)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return eventID, nil
}
