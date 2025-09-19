tell application "Google Chrome"
    activate
    delay 1
end tell

-- Use System Events to interact with the browser
tell application "System Events"
    tell process "Google Chrome"
        set frontmost to true
        delay 1

        -- Clear any existing text and type the domain
        keystroke "a" using command down
        delay 0.5
        keystroke "ptoagent.com"
        delay 1

        -- Press Enter to submit
        key code 36
        delay 2
    end tell
end tell

display notification "Domain entry completed. Please verify in Vercel dashboard." with title "Domain Setup"