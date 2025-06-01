FROM python:3.13-slim

# Ustaw zmienną środowiskową dla nieinteraktywnej instalacji
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Utwórz katalog roboczy
WORKDIR /app

# Skopiuj wymagania i zainstaluj zależności
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Skopiuj resztę aplikacji
COPY . .

# Aplikacja nasłuchuje na porcie 5001

EXPOSE 5001

# Uruchom aplikację Flask
CMD ["python", "app.py"]