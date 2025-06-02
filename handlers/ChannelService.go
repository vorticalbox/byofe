package handlers

import (
	"log/slog"

	"github.com/vorticalbox/byofe/database"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ChannelService struct {
	client     *mongo.Client
	database   *mongo.Database
	collection *mongo.Collection
	log        *slog.Logger
}

func NewPathService(db *database.DatabaseConnection, logger *slog.Logger) *ChannelService {
	collection := db.Database.Collection("channels")
	return &ChannelService{
		client:     db.Client,
		database:   db.Database,
		collection: collection,
		log:        logger,
	}
}

type Channel struct {
	ID          primitive.ObjectID `json:"_id" bson:"_id"`
	Name        string             `json:"name" bson:"name"`
	Tags        []string           `json:"tags" bson:"tags"`
	Description string             `json:"description" bson:"description"`
	Created     primitive.DateTime `json:"created" bson:"created"`
	OwnerID     primitive.ObjectID `json:"ownerId" bson:"ownerId"`
	Subscribers int                `json:"subscribers" bson:"subscribers"`
	Private     bool               `json:"private" bson:"private"`
}
