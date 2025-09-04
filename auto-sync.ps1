# Автоматическая синхронизация с GitHub с проверкой активности
# Запускается каждые 30 минут и проверяет, были ли изменения

param(
    [int]$MinutesThreshold = 60  # Проверяем файлы, измененные за последние 60 минут
)

$projectPath = "C:\Users\achinovnikov\conways-game-of-life"
$logFile = "$projectPath\sync-log.txt"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Add-Content -Path $logFile
}

# Переходим в папку проекта
Set-Location $projectPath

Write-Log "Auto-sync check started"

# Проверяем, были ли изменения в файлах за последний час
$threshold = (Get-Date).AddMinutes(-$MinutesThreshold)
$recentFiles = Get-ChildItem -Path $projectPath -Recurse -File | 
    Where-Object { 
        $_.LastWriteTime -gt $threshold -and 
        $_.FullName -notmatch "\.git\\" -and
        $_.Name -ne "sync-log.txt" -and
        $_.Extension -in @(".js", ".css", ".html", ".md", ".json")
    }

if ($recentFiles) {
    Write-Log "Recent activity detected. Files modified: $($recentFiles.Count)"
    
    # Проверяем статус git
    $status = git status --porcelain
    
    if ($status) {
        Write-Log "Changes detected in git. Syncing..."
        
        try {
            # Добавляем все изменения
            git add .
            
            # Создаем коммит с информативным сообщением
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
            $fileCount = ($status | Measure-Object).Count
            $message = "Auto-sync: $timestamp - $fileCount file(s) modified"
            git commit -m $message
            
            # Отправляем на GitHub
            git push origin master
            
            Write-Log "Successfully pushed to GitHub"
            Write-Host "Auto-sync completed successfully!" -ForegroundColor Green
        }
        catch {
            Write-Log "Error during sync: $_"
            Write-Host "Auto-sync failed! Check sync-log.txt for details" -ForegroundColor Red
        }
    }
    else {
        Write-Log "No uncommitted changes found"
    }
}
else {
    Write-Log "No recent activity detected. Skipping sync."
}

Write-Log "Auto-sync check completed"
Write-Log "----------------------------------------"
