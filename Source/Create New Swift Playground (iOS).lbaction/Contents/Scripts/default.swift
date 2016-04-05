#!/usr/bin/env xcrun swift

import Cocoa

@noreturn func logAndExit(message: String) {
    NSLog(message)
    exit(1)
}

enum LaunchBar {

    static func actionBundle() -> NSBundle {
        #if true
            guard let actionBundleURL = NSProcessInfo.processInfo().fileURLForEnvironmentKey("LB_ACTION_PATH") else {
                logAndExit("Environment does not have a value for LB_ACTION_PATH")
            }
        #else
            let actionBundleURL = NSURL(fileURLWithPath: ("~/Library/Application Support/LaunchBar/Actions/Create New Swift Playground (OS X).lbaction" as NSString).stringByExpandingTildeInPath)
        #endif

        guard let bundle = NSBundle(URL: actionBundleURL) else {
            logAndExit("LB_ACTION_PATH does not point to a valid bundle")
        }
        return bundle
    }

    static func actionSupportDirectoryURL() -> NSURL {
        #if true
            guard let actionSupportDirectoryURL = NSProcessInfo.processInfo().fileURLForEnvironmentKey("LB_SUPPORT_PATH") else {
                logAndExit("Environment does not have a value for LB_SUPPORT_PATH")
            }
        #else
            let actionSupportDirectoryURL = NSURL(fileURLWithPath: ("~/Library/Application Support/LaunchBar/Action Support/com.duckcode.LaunchBar.action.CreateNewSwiftPlayground" as NSString).stringByExpandingTildeInPath)
        #endif

        return actionSupportDirectoryURL
    }

    static func isShiftKeyDown() -> Bool {
        return NSProcessInfo.processInfo().boolForEnvironmentKey("LB_OPTION_SHIFT_KEY") ?? false
    }

}

extension NSProcessInfo {

    func fileURLForEnvironmentKey(key: String) -> NSURL? {
        guard let environmentValue = environment[key] else {
            return nil
        }
        return NSURL.fileURLWithPath(environmentValue)
    }

    func boolForEnvironmentKey(key: String) -> Bool? {
        guard let environmentValue = environment[key] else {
            return nil
        }
        return Int(environmentValue) == 1
    }

}

enum Action {

    static func templateFileURL() -> NSURL {
        guard let templateFileURL = LaunchBar.actionBundle().URLForResource("Template", withExtension: "playground") else {
            logAndExit("Cannot find Template.playground file")
        }
        return templateFileURL
    }

    static func destinationDirectoryURL() -> NSURL {
        let preferences = Action.preferences()
        guard let destinationDirectoryPath = preferences["destinationDirectory"] as? String else {
            logAndExit("Error to determine destination directory")
        }
        return NSURL(fileURLWithPath: (destinationDirectoryPath as NSString).stringByExpandingTildeInPath)
    }

    static func defaultDestinationDirectoryPath() -> String {
        let documentDirectories = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true)
        guard let documentDirectoryPath = documentDirectories.first else {
            logAndExit("Unable to find document directory")
        }
        return (documentDirectoryPath as NSString).stringByAbbreviatingWithTildeInPath
    }

    static func defaultPreferences() -> [String: AnyObject] {
        return ["destinationDirectory": defaultDestinationDirectoryPath()]
    }

    static func preferences() -> [String: AnyObject] {
        let preferencesFileURL = LaunchBar.actionSupportDirectoryURL().URLByAppendingPathComponent("preferences.plist", isDirectory: false)
        if let preferences = NSDictionary(contentsOfURL: preferencesFileURL) as? [String: AnyObject] {
            return preferences
        }

        let defaultPreferences = Action.defaultPreferences()
        (defaultPreferences as NSDictionary).writeToURL(preferencesFileURL, atomically: true)
        return defaultPreferences
    }

    static func playgroundName() -> String {
        var playgroundName: String!
        if Process.arguments.count == 1 {
            let formatter = NSDateFormatter()
            formatter.dateStyle = .ShortStyle
            formatter.timeStyle = .MediumStyle
            let dateString = formatter.stringFromDate(NSDate())
            playgroundName = "New Playground (\(dateString))"
        } else {
            playgroundName = Process.arguments[1]
        }
        playgroundName = playgroundName.stringByReplacingOccurrencesOfString(":", withString: "-")
        playgroundName = playgroundName.stringByReplacingOccurrencesOfString("/", withString: "-")
        playgroundName = playgroundName + ".playground"
        return playgroundName
    }

    static func playgroundFileURL() -> NSURL {
        let destinationDirectoryURL = Action.destinationDirectoryURL()
        return destinationDirectoryURL.URLByAppendingPathComponent(playgroundName(), isDirectory: false)
    }

}


let playgroundFileURL = Action.playgroundFileURL()
var isRegularFile: AnyObject?
_ = try? playgroundFileURL.getResourceValue(&isRegularFile, forKey: NSURLIsRegularFileKey)
if (isRegularFile as? NSNumber)?.boolValue != true {
    do {
        try NSFileManager.defaultManager().copyItemAtURL(Action.templateFileURL(), toURL: playgroundFileURL)
    } catch {
        logAndExit("Error: \(error)")
    }
}

if LaunchBar.isShiftKeyDown() {
    print(playgroundFileURL.path!)
} else {
    NSWorkspace.sharedWorkspace().openFile(playgroundFileURL.path!)
}
