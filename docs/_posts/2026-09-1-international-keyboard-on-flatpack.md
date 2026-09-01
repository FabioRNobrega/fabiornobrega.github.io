---
layout: post
comments: false
read_time: Read time of
title:  International Keyboard Dead Keys on Flatpak
date:   2026-09-01 09:00:00 -0300
categories: steamos linux flatpak
author: Fábio R. Nóbrega
continue: Read more
description: How to make US International dead keys work for cedilla inside Flatpak apps on Linux and SteamOS.
image: 2026-09-1-international-keyboard-on-flatpack.png
---

## The Problem

I use an international keyboard layout because it keeps the physical keyboard simple while still letting me write words from Portuguese and other languages.

The idea is simple: some keys do not print a character immediately. They wait for the next key. Those are called **dead keys**.

For example, with a US International layout:

- `'` + `a` becomes `á`
- `'` + `e` becomes `é`
- `~` + `a` becomes `ã`
- `"` + `u` becomes `ü`

That works nicely for many accents. But Portuguese has one small trap: **ç**.

On many systems, especially for Brazilian Portuguese habits, I expect:

```text
dead_acute + c -> ç
dead_acute + C -> Ç
```

That lets me type words like:

- `coração`
- `ação`
- `configuração`
- `açúcar`
- `façade`

The same idea applies to other countries too. A keyboard layout is not only about where the physical keys are. It is also about the compose rules that tell the system how two key presses become one character.

So the real problem is not "how do I type accents?". The problem is: **how do I teach the system the compose rules I expect?**

## Why This Is Easy on macOS

On macOS this usually feels built in. You enable an international keyboard, or a language-specific keyboard, and the system handles the composition rules globally.

For most daily writing, there is nothing special to configure:

- Choose the keyboard input source.
- Type the accent key.
- Type the base letter.
- macOS produces the composed character.

That global behavior is the comfortable version of the story. Apps mostly receive the final text after macOS has already handled the composition.

Linux can do the same thing, but the path is more explicit.

## The Linux Way: XCompose

On Linux, one of the classic ways to customize dead keys is with an **XCompose** file.

The file lives in your home directory:

```text
~/.XCompose
```

It lets you add personal compose rules while keeping the default rules from your locale.

For the cedilla case, the minimal version looks like this:

```bash
cat > ~/.XCompose << 'EOF'
include "%L"

<dead_acute> <c> : "ç" ccedilla
<dead_acute> <C> : "Ç" Ccedilla
EOF
```

The important line is:

```text
include "%L"
```

That keeps the default compose table for your current locale. Without it, you can accidentally replace the whole compose behavior with only your custom rules. That would fix `ç`, but break normal combinations like `á`, `é`, and `ã`. A tiny file, a surprisingly large foot-gun.

After creating `~/.XCompose`, log out and back in, or restart the apps that need to read it.

For normal Linux desktop apps, that is often enough.

## Where Flatpak Gets Different

Flatpak apps run inside a sandbox. That is good for isolation, but it also means an app may not see the same files, environment variables, or input-method behavior as the rest of the desktop.

So this global file:

```text
~/.XCompose
```

may fix dead keys in native apps, but still not affect a Flatpak app.

That is exactly what happened with Vivaldi on SteamOS. The desktop understood the dead keys. Other apps behaved. But Vivaldi, installed as a Flatpak, did not follow the same compose rule for:

```text
dead_acute + c -> ç
```

The solution was to give the Flatpak app its own compose file and force the app to use an input path where that file is respected.

## The Vivaldi Flatpak Fix

This Makefile applies the fix only to Vivaldi:

- It writes a private `XCompose` file inside Vivaldi's Flatpak config directory.
- It keeps the normal US International compose table.
- It adds only the cedilla rules.
- It starts Vivaldi/Chromium with X11, GTK3, and XIM.
- It points the sandbox to the private compose file with `XCOMPOSEFILE`.

Create a file named `Makefile` with:

```make
# SteamOS / Steam Deck - Vivaldi Flatpak dead-key fix
#
# Goal:
#   US International keyboard:
#     dead_acute + c -> ç
#     dead_acute + C -> Ç
#   while keeping:
#     dead_acute + a -> á
#     dead_acute + e -> é
#
# Usage:
#   make install
#   make status
#   make run
#
# Undo:
#   make uninstall
#
# Notes:
# - This fix is Vivaldi-only.
# - It forces Vivaldi/Chromium to X11 + GTK3 + XIM and gives it a private
#   XCompose file.
# - It does not modify your global ~/.XCompose.

APP_ID := com.vivaldi.Vivaldi
VIVALDI_DIR := $(HOME)/.var/app/$(APP_ID)/config
XCOMPOSE := $(VIVALDI_DIR)/XCompose
FLAGS := $(VIVALDI_DIR)/vivaldi-flags.conf

.PHONY: install compose flags overrides restart run status test uninstall help

help:
	@echo "Targets:"
	@echo "  make install    Apply the complete Vivaldi dead-key fix"
	@echo "  make status     Show current Flatpak/env/config state"
	@echo "  make run        Restart and launch Vivaldi"
	@echo "  make test       Print expected key combinations"
	@echo "  make uninstall  Remove only the settings added by this fix"

install: compose flags overrides restart
	@echo
	@echo "Installed."
	@echo "Test inside Vivaldi:"
	@echo "  dead_acute + c       -> ç"
	@echo "  dead_acute + Shift+c -> Ç"
	@echo "  dead_acute + a       -> á"
	@echo "  dead_acute + e       -> é"

compose:
	@mkdir -p "$(VIVALDI_DIR)"
	@printf '%s\n' \
		'include "/usr/share/X11/locale/en_US.UTF-8/Compose"' \
		'' \
		'<dead_acute> <c> : "ç" U00E7' \
		'<dead_acute> <C> : "Ç" U00C7' \
		> "$(XCOMPOSE)"
	@echo "Wrote $(XCOMPOSE)"

flags:
	@mkdir -p "$(VIVALDI_DIR)"
	@touch "$(FLAGS)"
	@grep -qxF -- '--ozone-platform=x11' "$(FLAGS)" || echo '--ozone-platform=x11' >> "$(FLAGS)"
	@grep -qxF -- '--gtk-version=3' "$(FLAGS)" || echo '--gtk-version=3' >> "$(FLAGS)"
	@echo "Updated $(FLAGS)"

overrides:
	@flatpak override --user \
		--nosocket=wayland \
		--socket=x11 \
		--env=GTK_IM_MODULE=xim \
		--env=XMODIFIERS=@im=none \
		--env=XCOMPOSEFILE="$(XCOMPOSE)" \
		$(APP_ID)
	@echo "Applied Flatpak overrides for $(APP_ID)"

restart:
	@flatpak kill $(APP_ID) >/dev/null 2>&1 || true

run: restart
	@flatpak run $(APP_ID)

status:
	@echo "=== Flatpak override ==="
	@flatpak override --user --show $(APP_ID) || true
	@echo
	@echo "=== Vivaldi environment inside sandbox ==="
	@flatpak run --command=sh $(APP_ID) -c '\
		echo "GTK_IM_MODULE=$$GTK_IM_MODULE"; \
		echo "XMODIFIERS=$$XMODIFIERS"; \
		echo "XCOMPOSEFILE=$$XCOMPOSEFILE"; \
		echo "XDG_CONFIG_HOME=$$XDG_CONFIG_HOME"; \
		echo; \
		echo "--- XCompose ---"; \
		test -f "$$XCOMPOSEFILE" && cat "$$XCOMPOSEFILE" || echo "missing"; \
		echo; \
		echo "--- vivaldi-flags.conf ---"; \
		test -f "$$XDG_CONFIG_HOME/vivaldi-flags.conf" && cat "$$XDG_CONFIG_HOME/vivaldi-flags.conf" || echo "missing"; \
		echo; \
		echo "--- system Compose file inside runtime ---"; \
		ls -l /usr/share/X11/locale/en_US.UTF-8/Compose \
	'

test:
	@echo "Expected in Vivaldi:"
	@echo "  dead_acute + c       -> ç"
	@echo "  dead_acute + Shift+c -> Ç"
	@echo "  dead_acute + a       -> á"
	@echo "  dead_acute + e       -> é"

uninstall:
	@flatpak kill $(APP_ID) >/dev/null 2>&1 || true
	@flatpak override --user \
		--unset-env=GTK_IM_MODULE \
		--unset-env=XMODIFIERS \
		--unset-env=XCOMPOSEFILE \
		$(APP_ID)
	@# Re-enable Wayland permission that this Makefile disabled.
	@flatpak override --user --socket=wayland $(APP_ID)
	@rm -f "$(XCOMPOSE)"
	@if [ -f "$(FLAGS)" ]; then \
		sed -i '\|^--ozone-platform=x11$$|d; \|^--gtk-version=3$$|d' "$(FLAGS)"; \
	fi
	@echo "Removed this fix from $(APP_ID)."
	@echo "Note: unrelated pre-existing Flatpak overrides were left untouched."

```

Then run:

```bash
make install
```

The target does four things.

First, `compose` writes this file:

```text
~/.var/app/com.vivaldi.Vivaldi/config/XCompose
```

The private compose file includes the system compose table from inside the Flatpak runtime:

```make
'include "/usr/share/X11/locale/en_US.UTF-8/Compose"'
```

Then it adds the two missing combinations:

```make
'<dead_acute> <c> : "ç" U00E7'
'<dead_acute> <C> : "Ç" U00C7'
```

Second, `flags` adds Chromium/Vivaldi flags:

```text
--ozone-platform=x11
--gtk-version=3
```

That avoids the Wayland path for this app and makes the GTK/XIM compose setup predictable.

Third, `overrides` changes only this Flatpak app:

```bash
flatpak override --user \
	--nosocket=wayland \
	--socket=x11 \
	--env=GTK_IM_MODULE=xim \
	--env=XMODIFIERS=@im=none \
	--env=XCOMPOSEFILE="$HOME/.var/app/com.vivaldi.Vivaldi/config/XCompose" \
	com.vivaldi.Vivaldi
```

The important part is `XCOMPOSEFILE`. It tells Vivaldi exactly which compose file to load from inside its sandbox.

Finally, `restart` kills the existing Vivaldi process so the next launch starts with the new environment.

## Check the Result

After installing, start Vivaldi again:

```bash
make run
```

Then test:

```text
dead_acute + c       -> ç
dead_acute + Shift+c -> Ç
dead_acute + a       -> á
dead_acute + e       -> é
```

If something still feels wrong, inspect the Flatpak override and the files visible inside the sandbox:

```bash
make status
```

That prints the configured environment variables, the private `XCompose` file, the Vivaldi flags file, and whether the system compose table exists inside the runtime.

## Undo

The fix is app-specific, so undoing it should also be app-specific:

```bash
make uninstall
```

That removes the environment variables added by this fix, removes the private compose file, removes the two Vivaldi flags, and restores the Wayland socket permission that this Makefile disabled.

It does not touch your global:

```text
~/.XCompose
```

## Key Takeaways

- International keyboard layouts use dead keys to compose accents and special letters.
- macOS makes this feel global and built in.
- On Linux, `~/.XCompose` gives you explicit control over compose rules.
- `include "%L"` keeps your default locale compose behavior.
- Flatpak apps may not follow your global compose file because they run in a sandbox.
- For Vivaldi on SteamOS, a private `XCompose` file plus Flatpak overrides makes `dead_acute + c` produce `ç`.
- The Makefile keeps the fix scoped to `com.vivaldi.Vivaldi`, which is exactly what I want when debugging one sandboxed app.
