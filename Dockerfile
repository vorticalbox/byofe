FROM golang:1.23.0
WORKDIR /app
COPY go.mod go.sum ./
COPY database database
COPY docs docs
COPY handlers handlers
COPY logger logger
COPY routes routes
COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server
CMD ["/server"]