package database

import (
	"context"
	"errors"
	"log/slog"
	"net/url"
	"os"
	"strings"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DatabaseConnection struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func NewDatabase(log *slog.Logger, ctx context.Context) (*DatabaseConnection, error) {
	connection := &DatabaseConnection{}
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		return nil, errors.New("MONGO_URI is not set")
	}
	log.Debug("Connecting to MongoDB")
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, err
	}
	log.Info("Connected to MongoDB")
	connection.Client = client
	u, err := url.Parse(uri)
	if err != nil {
		return nil, err
	}
	database := strings.Replace(u.Path, "/", "", 1)
	log.Debug("Connecting to database: " + strings.Replace(u.Path, "/", "", 1))
	db := client.Database(database)
	log.Debug("Connected to database: " + db.Name())
	connection.Database = db
	return connection, nil
}
