# Скрипт для синхронизации с GitHub
# Автоматически добавляет, коммитит и пушит изменения

Write-Host "Starting GitHub sync..." -ForegroundColor Cyan

# Проверяем статус
$status = git status --porcelain

if ($status) {
    Write-Host "Changes detected. Syncing..." -ForegroundColor Yellow
    
    # Добавляем все изменения
    git add .
    
    # Создаем коммит с временной меткой
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $message = "Auto-sync: $timestamp"
    git commit -m $message
    
    # Отправляем на GitHub
    git push origin master
    
    Write-Host "Changes pushed to GitHub successfully!" -ForegroundColor Green
} else {
    Write-Host "No changes to sync." -ForegroundColor Gray
}

Write-Host "Sync complete!" -ForegroundColor Cyan
