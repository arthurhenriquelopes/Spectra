# Screen sharing indicator detection constants
SCREEN_SHARE_INDICATORS = [
    # Generic Windows indicators
    "Screen sharing indicator",
    "You're sharing your screen",
    "Screen Share Notification", 
    "Screen Recording Indicator",
    "Sharing indicator",
    "Recording indicator",
    "You are sharing your screen",
    "Screen share active",
    "Recording in progress",
    
    # Browser-specific indicators
    "Chrome is sharing your screen",
    "Microsoft Edge is sharing your screen", 
    "Firefox is sharing your screen",
    "Safari is sharing your screen",
    "Opera is sharing your screen",
    "Brave is sharing your screen",
    "is sharing your screen",
    "wants to share your screen",
    "Screen capture in progress",
    "Display capture active",
    
    # Video conferencing platforms
    "Zoom is sharing your screen",
    "Microsoft Teams is sharing your screen",
    "Google Meet is sharing your screen",
    "Skype is sharing your screen",
    "Discord is sharing your screen",
    "Slack is sharing your screen",
    "WebEx is sharing your screen",
    "GoToMeeting is sharing your screen",
    "BlueJeans is sharing your screen",
    "Jitsi is sharing your screen",
    "BigBlueButton is sharing your screen",
    
    # Screen recording software
    "OBS is recording your screen",
    "OBS Studio is recording",
    "Camtasia is recording",
    "Bandicam is recording",
    "Fraps is recording",
    "XSplit is recording",
    "Streamlabs is recording",
    "Action! is recording",
    "Nvidia ShadowPlay",
    "AMD ReLive",
    "Windows Game Bar recording",
    "Xbox Game Bar recording",
    
    # Remote desktop and sharing tools
    "TeamViewer is sharing your screen",
    "AnyDesk is sharing your screen", 
    "Chrome Remote Desktop",
    "Windows Remote Desktop",
    "VNC is sharing your screen",
    "LogMeIn is sharing your screen",
    "Splashtop is sharing your screen",
    "Parsec is sharing your screen",
    
    # Generic patterns
    "sharing your desktop",
    "recording your desktop", 
    "capturing your screen",
    "desktop sharing active",
    "screen capture active",
    "display recording",
    "monitor sharing",
    "window sharing",
    "application sharing",
    "presentation mode active",
    
    # Notification variations
    "Screen share notification",
    "Recording notification", 
    "Capture notification",
    "Privacy indicator",
    "Camera and microphone access",
    "Microphone access",
    "Screen access granted",
    
    # Development and testing tools
    "Selenium is controlling",
    "Puppeteer is controlling",
    "Playwright is controlling",
    "Automated testing in progress",
    "Browser automation active"
]

SCREEN_SHARE_CLASSES = [
    # Browser notifications
    "Chrome_WidgetWin_1",  # Chrome screen share notification
    "MozillaDialogClass",  # Firefox screen share notification
    "EdgeWebView2",        # Edge screen share notification
    "OperaWindowClass",    # Opera browser
    "BraveWindowClass",    # Brave browser
    
    # Windows system notifications
    "NotificationPresenterHost",  # Windows notification
    "Windows.UI.Core.CoreWindow",  # Windows 10/11 notifications
    "ApplicationFrameHost",        # Windows 10/11 app frame
    "Shell_TrayWnd",              # System tray notifications
    
    # Video conferencing
    "ZPContentViewWndClass",      # Zoom
    "ZPFloatToolbarClass",        # Zoom toolbar
    "TeamsWebView",               # Microsoft Teams
    "SkypeWindowClass",           # Skype
    "DiscordWindowClass",         # Discord
    "SlackWindowClass",           # Slack
    
    # Screen recording software
    "Qt5QWindowIcon",             # OBS Studio
    "OBSWindowClass",             # OBS
    "CamtasiaStudioWindowClass",  # Camtasia
    "BandicamWindowClass",        # Bandicam
    "XSplitWindowClass",          # XSplit
    "StreamlabsWindowClass",      # Streamlabs
    "FrapsWindowClass",           # Fraps
    "ActionWindowClass",          # Mirillis Action!
    
    # Remote desktop tools
    "TeamViewer_DesktopWindowClass",  # TeamViewer
    "AnyDeskWindowClass",             # AnyDesk
    "VNCWindowClass",                 # VNC viewers
    "LogMeInWindowClass",             # LogMeIn
    "SplashtopWindowClass",           # Splashtop
    "ParsecWindowClass",              # Parsec
    
    # System recording indicators
    "GameBarDisplayCaptureIndicator", # Xbox Game Bar
    "NvidiaGeForceExperience",        # Nvidia ShadowPlay
    "AMDReliveWindowClass",           # AMD ReLive
    
    # Generic Windows classes
    "NotifyIconOverflowWindow",       # System tray overflow
    "ToolbarWindow32",                # Toolbar notifications
    "Static",                         # Static text windows
    "Button"                          # Button controls
]

SCREEN_SHARE_VERIFICATION_KEYWORDS = [
    "sharing", "screen", "record", "capture", "desktop",
    "monitor", "display", "streaming", "broadcast", "meeting",
    "presentation", "remote", "control", "access"
]

_INDICATORS_LOWER = tuple(text.lower() for text in SCREEN_SHARE_INDICATORS)
_SHARE_CLASSES_LOWER = tuple(name.lower() for name in SCREEN_SHARE_CLASSES)
_VERIFICATION_KEYWORDS_LOWER = tuple(k.lower() for k in SCREEN_SHARE_VERIFICATION_KEYWORDS)
