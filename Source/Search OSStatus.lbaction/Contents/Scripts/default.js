// LaunchBar Action Script

var ERROR_ICON = '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns';
var ERROR_DESCRIPTION_ICON = '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertNoteIcon.icns';
var QUESTION_MARK_ICON = '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericQuestionMarkIcon.icns';

var NOT_FOUND_MARKER = 'NOT_FOUND_MARKER';

function run() {
    LaunchBar.openURL('http://www.osstatus.com');
}

function runWithString(input) {
    if (input == undefined || input.length == 0) {
        return;
    }
    var searchURL = 'http://www.osstatus.com/api/search/errors.json?search=' + encodeURIComponent(input);
    var result = HTTP.getJSON(searchURL);

    if (result.data == undefined) {
        return;
    }

    var items = [];
    for (var i in result.data) {
        var item = resultItemFromData(result.data[i]);
        if (item != undefined) {
            items.push(item);
        }
    }

    switch (items.length) {
        case 0:
            return {
                title: 'No error codes found',
                icon: QUESTION_MARK_ICON,
            };

        case 1:
            return items[0].children;

        default:
            return items;
    }
}

function resultItemFromData(data) {
    verifyData(data);
    var valueInfoItem = createValueInfoItem(data);
    return {
        title: data.name,
        subtitle: data.description,
        alwaysShowsSubtitle: true,
        badge: valueInfoItem.title,
        icon: ERROR_ICON,
        children: [
            {
                title: data.name,
                badge: 'Name',
                icon: '',
            },
            {
                title: data.description,
                badge: 'Description',
                icon: ERROR_DESCRIPTION_ICON,
            },
            valueInfoItem,
            createPlatformItem(data),
            createFrameworkItem(data.framework),
            createHeaderItem(data.header_file, data.framework),
        ],
    }
}

function verifyData(data) {
    if (data.description == null) {
        data.description = 'No description';
    }

    // When searching for 'Foundation', the first result is ' NSContainerSpecifierError'
    // with an unnecessary space at the beginning, so we have to call trim() on the name:
    data.name = data.name.trim();

    // When searching for 'MKErrorDirectionsNotFound', the header is missing its .h extension:
    if (data.header_file.lastIndexOf('.') == -1) {
        data.header_file += '.h'
    }
}

function createPlatformItem(data) {
    var mapping = {
        'platform_mac': 'OS X',
        'platform_ios': 'iOS',
        'platform_watch': 'watchOS',
        'platform_tv': 'tvOS',
    };

    var resultComponents = [];
    for (key in mapping) {
        var candidate = data[key];
        if (candidate != undefined && candidate != null) {
            resultComponents.push(mapping[key]);
        }
    }

    if (resultComponents.length == 0) {
        return {
            title: 'None',
            badge: 'Platforms',
            icon: QUESTION_MARK_ICON,
        };
    } else {
        var icon = resultComponents[0];
        if (data.platform_mac && data.platform_ios) {
            icon = 'OS X & iOS';
        }

        return {
            title: resultComponents.join(', '),
            badge: 'Platforms',
            icon: icon,
        };
    }
}

function createValueInfoItem(data) {
    var mapping = {
        'value_integer': 'Integer',
        'value_ostype': 'OSType',
        'value_string': 'String',
        'value_hex': 'Hex',
    };

    for (key in mapping) {
        var candidate = data[key];
        if (candidate != undefined && candidate != null) {
            return {
                title: candidate,
                badge: mapping[key] + ' value',
                icon: ERROR_ICON,
            };
        }
    }

    return {
        title: 'Unknown',
        type: 'Unknown',
        icon: QUESTION_MARK_ICON,
    };
}

function createFrameworkItem(frameworkName) {
    var frameworkPath = frameworkPathForFrameworkWithName(frameworkName);
    if (frameworkPath != undefined) {
        return { path: frameworkPath };
    }

    return {
        title: frameworkName,
        badge: 'Framework',
        icon: QUESTION_MARK_ICON
    };
}

// Keys are the name of the framework. Values are:
// - full path (string) if already found.
// - NOT_FOUND_MARKER if already searched, but not found.
var frameworkPathCache = {};
function frameworkPathForFrameworkWithName(frameworkName) {
    var frameworkPath = frameworkPathCache[frameworkName];
    if (frameworkPath != undefined) {
        if (frameworkPath == NOT_FOUND_MARKER) {
            // Already searched, but not found.
            return;
        }
        return frameworkPath;
    }

    var rootPaths = [
        // Prefer Xcode-beta.app:
        '/Applications/Xcode-beta.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/',
        '/Applications/Xcode-beta.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/',
        '/Applications/Xcode-beta.app/Contents/Developer/Platforms/WatchOS.platform/Developer/SDKs/WatchOS.sdk/',
        '/Applications/Xcode-beta.app/Contents/Developer/Platforms/AppleTVOS.platform/Developer/SDKs/AppleTVOS.sdk/',

        // Xcode.app:
        '/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/',
        '/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/',
        '/Applications/Xcode.app/Contents/Developer/Platforms/WatchOS.platform/Developer/SDKs/WatchOS.sdk/',
        '/Applications/Xcode.app/Contents/Developer/Platforms/AppleTVOS.platform/Developer/SDKs/AppleTVOS.sdk/',

         // Fallback to system's framework folder, which does not have any headers:
        '/',
    ];

    // The OS X SDK has the version number in it, so we'll find it and add it as the first
    // SDK path to search. The other SDKs have a version number in their name too, but there's
    // a link without a version number that points to the current one.
    var macSDK = macSDKPath();
    if (macSDK != undefined) {
        rootPaths.splice(0, 0, macSDK + '/');
    }

    // All kinds of paths that may have frameworks in them on any platform:
    var frameworkPaths = [
        'System/Library/Frameworks/',
        'System/Library/Frameworks/Accelerate.framework/Frameworks/',
        'System/Library/Frameworks/ApplicationServices.framework/Frameworks/',
        'System/Library/Frameworks/Automator.framework/Frameworks/',
        'System/Library/Frameworks/Carbon.framework/Frameworks/',
        'System/Library/Frameworks/CoreServices.framework/Frameworks/',
        'System/Library/Frameworks/IMServicePlugIn.framework/Frameworks/',
        'System/Library/Frameworks/IOBluetooth.framework/Frameworks/',
        'System/Library/Frameworks/JavaVM.framework/Frameworks/',
        'System/Library/Frameworks/OpenDirectory.framework/Frameworks/',
        'System/Library/Frameworks/Quartz.framework/Frameworks/',
        'System/Library/Frameworks/WebKit.framework/Frameworks/',
        'System/Library/LocationBundles/',
        'System/Library/PrivateFrameworks/',
    ];

    for (i in rootPaths) {
        for (var j in frameworkPaths) {
            var candidate = rootPaths[i] + frameworkPaths[j] + frameworkName + '.framework';
            if (File.exists(candidate)) {
                frameworkPathCache[frameworkName] = candidate;
                return candidate;
            }
        }
    }

    frameworkPathCache[frameworkName] = NOT_FOUND_MARKER;
}

// The path to the latest OS X SDK in /Applications/Xcode.app:
// - undefined if not yet checked.
// - NOT_FOUND_MARKER if not found.
// - full path (string) otherwise.
var macSDKPathCache = undefined;
function macSDKPath() {
    if (macSDKPathCache == undefined) {
        var macSDKsPath = '/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/';
        var macSDKName = File.getDirectoryContents(macSDKsPath).pop();
        if (macSDKName == undefined) {
            macSDKPathCache = NOT_FOUND_MARKER;
            return;
        }

        macSDKPathCache = macSDKsPath + macSDKName;
    }
    return macSDKPathCache == NOT_FOUND_MARKER ? undefined : macSDKPathCache;
}

function createHeaderItem(headerName, frameworkName) {
    var headerPath = headerPathForHeaderWithName(headerName, frameworkName);
    if (headerPath != undefined) {
        return { path: headerPath };
    }

    return {
        title: headerName,
        badge: 'Header File',
        icon: QUESTION_MARK_ICON
    };
}

// Keys are the name of the header file. Values are:
// - full path (string) if already found.
// - NOT_FOUND_MARKER if already searched, but not found.
var headerPathCache = {};
function headerPathForHeaderWithName(headerName, frameworkName) {
    var cacheKey = frameworkName + '/' + headerName;
    var headerPath = headerPathCache[cacheKey];
    if (headerPath != undefined) {
            if (headerPath == NOT_FOUND_MARKER) {
            // Already searched, but not found.
            return;
        }
        return headerPath;
    }

    var frameworkPath = frameworkPathForFrameworkWithName(frameworkName);
    if (frameworkPath == undefined) {
        headerPathCache[cacheKey] = NOT_FOUND_MARKER;
        return;
    }

    var frameworkHeadersPath = frameworkPath + '/Headers/';

    // Best case: header file is directly in ".framework/Headers" directory:
    var headerPath = frameworkHeadersPath + headerName;
    if (File.exists(headerPath)) {
        headerPathCache[cacheKey] = headerPath;
        return headerPath;
    }

    // Search ".framework/Headers" subdirectories:
    headerPath = recursivelyFindFileInDirectory(headerName, frameworkHeadersPath);
    if (headerPath != undefined) {
        headerPathCache[cacheKey] = headerPath;
        return headerPath;
    }

    headerPathCache[cacheKey] = NOT_FOUND_MARKER;
}

function recursivelyFindFileInDirectory(filename, directoryPath) {

    // Sanity check:
    if (!File.isDirectory(directoryPath)) {
        return;
    }

    // Check if file exists:
    var filePath = directoryPath + '/' + filename;
    if (File.exists(filePath)) {
        return filePath;
    }

    var subdirectories;
    try {
        subdirectories = File.getDirectoryContents(directoryPath);
    } catch (exception) {
        // LaunchBar 6.5 (6122) didn't resolve symbolic links and getDirectoryContents() would throw an exception.
        return;
    }

    // Search all subdirectories:
    for (i in subdirectories) {
        var subdirectory = directoryPath + '/' + subdirectories[i];
        if (File.isDirectory(subdirectory)) {
            var filePath = recursivelyFindFileInDirectory(filename, subdirectory);
            if (filePath != undefined) {
                return filePath;
            }
        }
    }
}
