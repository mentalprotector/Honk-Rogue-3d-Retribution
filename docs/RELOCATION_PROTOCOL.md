# Server Relocation & Service Recovery Protocol

This document outlines the steps to safely move the physical server and ensure all HonkRogue services resume correctly without data loss.

## 1. Pre-Move Checklist
Before unplugging the server, perform these checks:
- **Service Status:** Verify which services are running.
  ```bash
  docker compose ps
  ```
- **Persistence Check:** Ensure your `docker-compose.yml` uses volumes for any critical data (though HonkRogue is currently stateless/asset-based, this is good practice).
- **Auto-Start Config:** Ensure Docker is configured to start on boot.
  ```bash
  sudo systemctl is-enabled docker
  # If not enabled:
  sudo systemctl enable docker
  ```

## 2. Graceful Shutdown
To prevent filesystem corruption:
1.  **Stop Docker Services:**
    ```bash
    docker compose stop
    ```
2.  **Shutdown OS:**
    ```bash
    sudo shutdown now
    ```
3.  **Wait:** Wait until the power LED is off before unplugging.

## 3. Physical Relocation
- Move the server to the new outlet.
- Ensure stable power and network connection.

## 4. Service Recovery
1.  **Power On:** Turn the server back on.
2.  **Verify OS & Docker:**
    ```bash
    sudo systemctl status docker
    ```
3.  **Verify Services:**
    Since the `docker-compose.yml` uses `restart: unless-stopped`, the services should start automatically. Check their status:
    ```bash
    docker compose ps
    ```
4.  **Manual Start (If necessary):**
    If services didn't start:
    ```bash
    docker compose up -d
    ```

## 5. Post-Recovery Validation
- **Health Check:** Open the game URL (default port 8090) to ensure it's accessible.
- **Log Inspection:** Check for any errors during startup.
    ```bash
    docker compose logs --tail=50
    ```

---
*Created by Gemini CLI Orchestrator - 2026-01-07*
