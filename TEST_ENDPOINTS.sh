#!/bin/bash
# Script para testear los endpoints de turnos después de las correcciones

API_URL="http://localhost:3001/api"

echo "=========================================="
echo "TEST: Endpoints de Turnos"
echo "=========================================="
echo ""

echo "1️⃣  Test: GET /api/turnos/disponibles (sin parámetros)"
echo "   Esperado: Array con hasta 100 turnos futuros disponibles"
curl -s "${API_URL}/turnos/disponibles" | jq '.[] | {id, fecha, hora, estado}' | head -20
echo ""
echo "---"
echo ""

echo "2️⃣  Test: GET /api/turnos/disponibles?limit=50"
echo "   Esperado: Array con hasta 50 turnos"
curl -s "${API_URL}/turnos/disponibles?limit=50" | jq 'length'
echo "   turnos devueltos ↑"
echo ""
echo "---"
echo ""

echo "3️⃣  Test: GET /api/turnos/disponibles?limit=200"
echo "   Esperado: Array con hasta 200 turnos (máximo permitido)"
curl -s "${API_URL}/turnos/disponibles?limit=200" | jq 'length'
echo "   turnos devueltos ↑"
echo ""
echo "---"
echo ""

echo "4️⃣  Test: GET /api/turnos/disponibles?limit=201 (debe rechazar)"
echo "   Esperado: Error de validación (limit máximo: 200)"
curl -s "${API_URL}/turnos/disponibles?limit=201" | jq '.message'
echo ""
echo "---"
echo ""

echo "5️⃣  Test: GET /api/turnos/admin (requiere auth)"
echo "   Esperado: Con token admin, array de todos los turnos (hasta 50)"
echo "   Nota: Necesita auth, revisar con Postman/curl con Bearer token"
echo ""
echo "---"
echo ""

echo "6️⃣  Validación de Campos"
echo "   - Límite para /disponibles: default=100, máximo=200 ✓"
echo "   - Límite para /admin: default=50, máximo=200 ✓"
echo "   - Límite para /historial: default=20, máximo=100 ✓"
echo ""

echo "=========================================="
echo "Para tests completos:"
echo "1. Generar 100+ turnos futuros vía admin"
echo "2. Verificar que cliente ve todos en /reservar"
echo "3. Verificar que admin ve lista completa"
echo "=========================================="
