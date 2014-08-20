#!/usr/bin/env xcrun swift

import Cocoa


func getEnvironment(name: String) -> String {
    let environment = NSProcessInfo.processInfo().environment
    if let result: AnyObject = environment[name] {
        // This cast is broken in Xcode 6 Beta 6. radar://18075120
        if let resultString = result as? String {
            return resultString
        } else {
            NSLog("Value for environment variable \(name) is not a String")
        }
    } else {
        NSLog("No value for environment variable \(name)")
    }

    exit(1)
}

func getTemplatePath() -> String {
    let actionBundle = NSBundle(path:getEnvironment("LB_ACTION_PATH"))
    let maybeTemplatePath = actionBundle.pathForResource("Template", ofType:"playground")
    if let templatePath = maybeTemplatePath {
        if NSFileManager.defaultManager().fileExistsAtPath(templatePath) {
            return templatePath
        }
        NSLog("Template file doesn't exist: \(templatePath)")
    } else {
        NSLog("Template.playground not found in action's bundle")
    }

    exit(1)
}

func getDestinationDirectory() -> String {
    let preferencesPath = getEnvironment("LB_SUPPORT_PATH").stringByAppendingPathComponent("preferences.plist")
    if !NSFileManager.defaultManager().fileExistsAtPath(preferencesPath) {
        let documentDirectories = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true)
        if var result = documentDirectories.first as? NSString {
            result = result.stringByAbbreviatingWithTildeInPath
            (["destinationDirectory": result] as NSDictionary).writeToFile(preferencesPath, atomically: true)
        }
    }

    let preferences = NSDictionary(contentsOfFile:preferencesPath)
    if let result = preferences["destinationDirectory"] as? String {
        return result.stringByExpandingTildeInPath
    }

    NSLog("Unable to get destination directory")
    exit(1)
}

func getPlaygroundName() -> String {
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

func getPlaygroundPath() -> String {
    return getDestinationDirectory().stringByAppendingPathComponent(getPlaygroundName())
}

func copyItem(sourcePath: String, targetPath: String) {
    var error: NSError?
    if !NSFileManager.defaultManager().copyItemAtPath(sourcePath, toPath:targetPath, error:&error) {
        if let copyError = error {
            NSLog("Error copying template playground: \(copyError)")
            exit(1)
        }
    }
}


let playgroundPath = getPlaygroundPath()
if !NSFileManager.defaultManager().fileExistsAtPath(playgroundPath) {
    copyItem(getTemplatePath(), playgroundPath)
}

let shiftKeyDown = (getEnvironment("LB_OPTION_SHIFT_KEY") as NSString).boolValue
if shiftKeyDown {
    println(playgroundPath)
} else {
    NSWorkspace.sharedWorkspace().openFile(playgroundPath)
}
