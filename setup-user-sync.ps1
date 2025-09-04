# Упрощенный скрипт для настройки автоматической синхронизации
# Не требует прав администратора

$taskName = "ConwaysGameOfLife-AutoSync"
$scriptPath = "C:\Users\achinovnikov\conways-game-of-life\auto-sync.ps1"

Write-Host "Setting up automatic GitHub sync for Conway's Game of Life..." -ForegroundColor Cyan
Write-Host "This will create a user-level scheduled task." -ForegroundColor Yellow

# Создаем XML для задачи
$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')</Date>
    <Author>$env:USERNAME</Author>
    <Description>Automatically syncs Conway's Game of Life project with GitHub every 30 minutes when there are changes</Description>
  </RegistrationInfo>
  <Triggers>
    <TimeTrigger>
      <Repetition>
        <Interval>PT30M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$env:USERDOMAIN\$env:USERNAME</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>PowerShell.exe</Command>
      <Arguments>-WindowStyle Hidden -ExecutionPolicy Bypass -File "$scriptPath"</Arguments>
      <WorkingDirectory>C:\Users\achinovnikov\conways-game-of-life</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

# Сохраняем XML во временный файл
$tempXmlFile = "$env:TEMP\ConwaysGameTask.xml"
$taskXml | Out-File -FilePath $tempXmlFile -Encoding Unicode

try {
    # Проверяем, существует ли задача
    $existingTask = schtasks /query /tn $taskName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Removing existing task..." -ForegroundColor Yellow
        schtasks /delete /tn $taskName /f | Out-Null
    }
    
    # Создаем задачу через schtasks
    Write-Host "Creating scheduled task..." -ForegroundColor Cyan
    $result = schtasks /create /tn $taskName /xml $tempXmlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nTask created successfully!" -ForegroundColor Green
        Write-Host "The auto-sync will run every 30 minutes." -ForegroundColor Cyan
        
        # Запускаем задачу для теста
        Write-Host "`nRunning initial test..." -ForegroundColor Yellow
        schtasks /run /tn $taskName | Out-Null
        
        Write-Host "`nSetup complete!" -ForegroundColor Green
        Write-Host "`nUseful commands:" -ForegroundColor Cyan
        Write-Host "  Run now: schtasks /run /tn $taskName" -ForegroundColor Gray
        Write-Host "  View status: schtasks /query /tn $taskName /v" -ForegroundColor Gray
        Write-Host "  Disable: schtasks /change /tn $taskName /disable" -ForegroundColor Gray
        Write-Host "  Enable: schtasks /change /tn $taskName /enable" -ForegroundColor Gray
        Write-Host "  Delete: schtasks /delete /tn $taskName /f" -ForegroundColor Gray
        Write-Host "`nCheck sync-log.txt for sync history." -ForegroundColor Yellow
    } else {
        Write-Host "Failed to create task. Error: $result" -ForegroundColor Red
        Write-Host "`nTrying alternative method..." -ForegroundColor Yellow
        
        # Альтернативный метод - создание простой задачи
        $action = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
        schtasks /create /tn $taskName /tr "powershell.exe $action" /sc minute /mo 30 /f
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Task created with alternative method!" -ForegroundColor Green
        }
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    # Удаляем временный файл
    if (Test-Path $tempXmlFile) {
        Remove-Item $tempXmlFile -Force
    }
}

Write-Host "`nTo view the task in GUI: Press Win+R, type 'taskschd.msc' and press Enter" -ForegroundColor Cyan
