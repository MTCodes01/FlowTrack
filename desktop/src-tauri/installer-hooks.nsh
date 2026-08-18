!macro NSIS_HOOK_POSTUNINSTALL
  ; Remove autostart registry key added by tauri-plugin-autostart
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "FlowTrack"
  
  ; Remove LocalAppData and AppData directories containing the agent and user details
  RMDir /r "$LOCALAPPDATA\app.flowtrack.desktop"
  RMDir /r "$APPDATA\app.flowtrack.desktop"
  
  ; Also try standard FlowTrack folders just in case
  RMDir /r "$LOCALAPPDATA\FlowTrack"
  RMDir /r "$APPDATA\FlowTrack"
!macroend
