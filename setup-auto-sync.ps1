# Скрипт для настройки автоматической синхронизации через Task Scheduler
# Требует запуска с правами администратора

$taskName = "ConwaysGameOfLife-AutoSync"
$taskPath = "\GitHubSync\"
$scriptPath = "C:\Users\achinovnikov\conways-game-of-life\auto-sync.ps1"

Write-Host "Setting up automatic GitHub sync for Conway's Game of Life..." -ForegroundColor Cyan

# Проверяем, запущен ли скрипт с правами администратора
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host "`nAlternatively, you can create the task manually:" -ForegroundColor Cyan
    Write-Host "1. Open Task Scheduler (taskschd.msc)"
    Write-Host "2. Create a new task with these settings:"
    Write-Host "   - Name: $taskName"
    Write-Host "   - Trigger: Every 30 minutes"
    Write-Host "   - Action: Start PowerShell with arguments: -ExecutionPolicy Bypass -File `"$scriptPath`""
    Write-Host "   - Run only when user is logged on"
    exit 1
}

try {
    # Проверяем, существует ли уже задача
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    
    if ($existingTask) {
        Write-Host "Task already exists. Removing old task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
    
    # Создаем действие
    $action = New-ScheduledTaskAction `
        -Execute "PowerShell.exe" `
        -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
    
    # Создаем триггер - каждые 30 минут
    $trigger = New-ScheduledTaskTrigger `
        -Once `
        -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes 30) `
        -RepetitionDuration (New-TimeSpan -Days 365)
    
    # Создаем настройки
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -DontStopOnIdleEnd
    
    # Создаем principal (для запуска от имени текущего пользователя)
    $principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -LogonType Interactive `
        -RunLevel Limited
    
    # Регистрируем задачу
    $task = Register-ScheduledTask `
        -TaskName $taskName `
        -TaskPath $taskPath `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Automatically syncs Conway's Game of Life project with GitHub every 30 minutes when there are changes"
    
    Write-Host "`nTask created successfully!" -ForegroundColor Green
    Write-Host "The auto-sync will run every 30 minutes and check for changes." -ForegroundColor Cyan
    
    # Запускаем задачу сразу для проверки
    Write-Host "`nRunning initial sync test..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName "$taskPath$taskName"
    
    Start-Sleep -Seconds 3
    
    # Проверяем статус
    $taskInfo = Get-ScheduledTask -TaskName $taskName
    Write-Host "`nTask Status: $($taskInfo.State)" -ForegroundColor Cyan
    
    Write-Host "`nSetup complete! The task will run automatically every 30 minutes." -ForegroundColor Green
    Write-Host "To manage the task, use Task Scheduler or these commands:" -ForegroundColor Cyan
    Write-Host "  View task: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  Disable: Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  Enable: Enable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  Remove: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
}
catch {
    Write-Host "Error creating scheduled task: $_" -ForegroundColor Red
    Write-Host "`nPlease create the task manually using Task Scheduler." -ForegroundColor Yellow
}
