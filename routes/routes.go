package routes

import (
	"log/slog"

	"github.com/vorticalbox/byofe/database"
	"github.com/vorticalbox/byofe/handlers"

	"github.com/go-chi/chi/v5"
)

func NewRouter(db *database.DatabaseConnection, log *slog.Logger) *chi.Mux {
	r := chi.NewRouter()
	heartbeatService := handlers.NewHeartbeatService(db, log)
	r.Get("/heartbeat", heartbeatService.HeartBeat())
	authService := handlers.NewAuthService(db, log)

	r.Post("/login", authService.Login())
	r.Post("/register", authService.Register())
	// ! middleware must be applied before any routes on the router
	r.Route("/", func(r chi.Router) {
		r.Use(authService.Middleware)
		r.Get("/current-user", authService.CurrentUser())
	})
	return r
}
