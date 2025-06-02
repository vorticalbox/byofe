package logger

import (
	"log/slog"
	"os"
)

func NewLogger() *slog.Logger {
	level := slog.LevelInfo
	envLogLevel := os.Getenv("LOG_LEVEL")
	if envLogLevel != "" {
		switch envLogLevel {
		case "DEBUG":
			level = slog.LevelDebug
		case "INFO":
			level = slog.LevelInfo
		case "WARN":
			level = slog.LevelWarn
		case "ERROR":
			level = slog.LevelError
		}
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: level,
	}))
	return logger
}
