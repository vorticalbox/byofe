package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/vorticalbox/byofe/database"
	"github.com/vorticalbox/byofe/docs"
	"github.com/vorticalbox/byofe/logger"
	"github.com/vorticalbox/byofe/routes"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
)

var version string = "0.0.1"

// @title						BYOFE
// @description				Bring Your Own Front End
// @contact.name				Vorticalbox
// @contact.email				vorticalbox@protonmail.com
// @securityDefinitions.apikey	WithToken
// @in							header
// @name						x-access-token
// @description				token gerneated by the login endpoint
func main() {
	godotenv.Load()
	logger := logger.NewLogger()
	ctx := context.Background()
	db, err := database.NewDatabase(logger, ctx)
	if err != nil {
		panic(err)
	}
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	host := os.Getenv("HOST")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	var url string
	if os.Getenv("GO_ENV") == "production" {
		if host == "" {
			panic("HOST is required in production")
		}
		docs.SwaggerInfo.Host = host
		url = fmt.Sprintf("https://%s", host)
	} else {
		url = fmt.Sprintf("http://localhost:%s", port)
	}
	docs.SwaggerInfo.Version = version
	swaggerUrl := fmt.Sprintf("%s/swagger/doc.json", url)
	application := routes.NewRouter(db, logger)
	application.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL(swaggerUrl)))
	application.Get("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, fmt.Sprintf("%s/swagger/", url), http.StatusMovedPermanently)
	})
	r.Mount("/", application)
	logger.Info(fmt.Sprintf("Listening at %s", url))
	logger.Info(fmt.Sprintf("APi version: %s", version))
	logger.Info(fmt.Sprintf("Open API: %s/swagger", url))
	logger.Info(fmt.Sprintf("Open API (JSON): %s/swagger/doc.json", url))
	http.ListenAndServe(fmt.Sprintf(":%s", port), r)
}
