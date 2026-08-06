PORT ?= 3001
LOCAL_DIR := .local
PID_FILE := $(LOCAL_DIR)/dev.pid
LOG_FILE := $(LOCAL_DIR)/dev.log

.PHONY: up down status logs

up:
	@mkdir -p "$(LOCAL_DIR)"
	@if [ -f "$(PID_FILE)" ] && kill -0 "$$(cat "$(PID_FILE)")" 2>/dev/null; then \
		echo "Presentation is already running: http://localhost:$(PORT)"; \
		exit 0; \
	fi
	@if lsof -nP -iTCP:$(PORT) -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "Port $(PORT) is already in use"; \
		exit 1; \
	fi
	@rm -f "$(PID_FILE)"
	@npm run content
	@nohup env WRANGLER_LOG_PATH=.wrangler/wrangler.log \
		./node_modules/.bin/vinext dev --port $(PORT) \
		>"$(LOG_FILE)" 2>&1 & echo $$! >"$(PID_FILE)"
	@attempt=0; \
	until curl -fsS "http://localhost:$(PORT)/" >/dev/null 2>&1; do \
		attempt=$$((attempt + 1)); \
		if [ "$$attempt" -ge 60 ]; then \
			echo "Server did not start. See $(LOG_FILE)"; \
			kill "$$(cat "$(PID_FILE)")" 2>/dev/null || true; \
			rm -f "$(PID_FILE)"; \
			exit 1; \
		fi; \
		sleep 0.5; \
	done
	@echo "Presentation is running: http://localhost:$(PORT)"
	@echo "Logs: $(LOG_FILE)"

down:
	@if [ ! -f "$(PID_FILE)" ]; then \
		echo "Presentation is not running"; \
		exit 0; \
	fi; \
	pid="$$(cat "$(PID_FILE)")"; \
	if kill -0 "$$pid" 2>/dev/null; then \
		kill "$$pid"; \
		attempt=0; \
		while kill -0 "$$pid" 2>/dev/null; do \
			attempt=$$((attempt + 1)); \
			if [ "$$attempt" -ge 20 ]; then \
				echo "Process $$pid did not stop"; \
				exit 1; \
			fi; \
			sleep 0.25; \
		done; \
	fi; \
	rm -f "$(PID_FILE)"; \
	echo "Presentation stopped"

status:
	@if [ -f "$(PID_FILE)" ] && kill -0 "$$(cat "$(PID_FILE)")" 2>/dev/null; then \
		echo "Presentation is running: http://localhost:$(PORT)"; \
	else \
		echo "Presentation is not running"; \
	fi

logs:
	@mkdir -p "$(LOCAL_DIR)"
	@touch "$(LOG_FILE)"
	@tail -f "$(LOG_FILE)"
