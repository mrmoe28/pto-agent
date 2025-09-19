tell application "Google Chrome"
    activate
    delay 1
end tell

tell application "System Events"
    tell process "Google Chrome"
        set frontmost to true
        delay 1

        -- First, clear the field completely
        -- Select all text
        keystroke "a" using command down
        delay 0.5

        -- Delete the selected text
        key code 51 -- Delete key
        delay 0.5

        -- Now type the correct domain
        keystroke "ptoagent.com"
        delay 1

        -- Make sure we're still in the input field and the text is correct
        -- Select all again to verify
        keystroke "a" using command down
        delay 0.5

        -- Deselect by clicking at the end
        key code 124 -- Right arrow key
        delay 0.5

        -- Now submit by pressing Enter
        key code 36 -- Enter key
        delay 2
    end tell
end tell

display notification "Domain ptoagent.com has been entered. Please verify in Vercel." with title "Domain Setup"