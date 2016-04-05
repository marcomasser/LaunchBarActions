LaunchBar Actions
=================

# Search OSStatus

This action uses [osstatus.com](http://www.osstatus.com) to look up information about error codes on Apple’s platforms. This is useful if you’re a developer who wants to look up some error code or constant but you don’t know in which framework or in which header it is defined.

As a bonus, if you have Xcode installed (either as /Applications/Xcode.app or /Applications/Xcode-beta.app), the search results let you browse the related frameworks and header files directly in the respective SDK.


# Create New Swift Playground

Oftentimes, I just want to try something out in a clean Playground, but switching to Xcode, creating a new Playground and (most importantly) then deciding how to name it and where to save it is just no fun for me.

That’s why I wrote a LaunchBar Action that just creates a new Playground and opens it right away. You can optionally enter a name for the Playground, but you don’t have to (a timestamped name is used by default).

It’s written in Swift 2.2, so Xcode 7.3 is required.


# Swift Demangle

Uses “xcrun swift-demangle” to convert a mangled Swift symbol name to a human-readable Swift symbol name. Handy for quickly selecting some mangled symbol and sending it to LaunchBar via Instant Send, then demangling the symbol.

Here’s a mangled name for you to try: __TFCCC4test1a1b1c1dfS2_FTS0_1xS1_1vFT1xSi_Si_OVS_1e1f

For more information, read Mike Ash’s post on [Swift Name Mangling](https://mikeash.com/pyblog/friday-qa-2014-08-15-swift-name-mangling.html).
