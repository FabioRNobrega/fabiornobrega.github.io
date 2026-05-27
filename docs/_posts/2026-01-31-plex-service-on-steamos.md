---
layout: post
comments: false
read_time: Read time of
title:  Plex Media Server on SteamOS
date:   2026-01-31 09:00:00 -0300
categories: steamos
author: Fábio R. Nóbrega
continue: Read more
description: This guide explains how to install Plex Media Server on SteamOS.
image: 2026-01-31-plex-service-on-steamos.png
---

## Install Plex Media Server on SteamOS (Update-Proof Method)

This guide explains how to install **Plex Media Server on SteamOS (Steam Deck)** in a way that:

- ✅Survives SteamOS updates
- ✅ Uses official Plex binaries
- ✅ Avoids pacman / AUR / Flatpak limitations
- ✅ Starts automatically in Desktop Mode
- ✅ Requires no containers or root services

SteamOS uses an **immutable OS image**, so traditional Arch Linux tutorials **do not apply**.
The correct approach is to install Plex entirely in **user space (`$HOME`)** and manage it with a **user systemd service**.

#### Why this works on SteamOS

SteamOS updates overwrite:
1. `/usr`, `/etc`, `/var`
2. pacman / AUR installs
3. system systemd services

SteamOS preserves:

```bash
/home/deck
~/.local
~/.config
```

- **user systemd services**

This tutorial installs Plex **only inside `$HOME`**, so it is never removed by updates.

#### What you need

1. SteamOS (Steam Deck or LegionGo)
2. Desktop Mode
3. Plex Media Server `.deb` file downloaded from [Plex](https://www.plex.tv/media-server-downloads/?cat=computer&plat=linux)

> Recommended download: **Ubuntu / Debian – Intel/AMD 64-bit**
>
> Example file name:  plexmediaserver_1.42.2.10156-f737b826c_amd64.deb

#### Step 1 – Prepare directories

```bash
mkdir -p ~/.local/plex
mkdir -p ~/.local/bin
mkdir -p ~/.config/plex
```

#### Step 2 – Extract the `.deb` (no dpkg required)

SteamOS does **not** include `dpkg-deb`.
A `.deb` file is just an `ar` archive, so we extract it manually.

```bash
cd ~/Downloads
mkdir plex-deb
cd plex-deb

ar x ../plexmediaserver_1.42.2.10156-f737b826c_amd64.deb
tar -xf data.tar.*
```

Move files into your home:

```bash
mv usr ~/.local/plex/
```

Final Plex binary location:

```
~/.local/plex/usr/lib/plexmediaserver/Plex Media Server
```

#### Step 3 – First run (test)

```bash
~/.local/plex/usr/lib/plexmediaserver/Plex\ Media\ Server
```

Open in browser:

```bash
http://localhost:32400/web
```

Stop with **Ctrl+C**.

#### Step 4 – Create a wrapper start script

```bash
nano ~/.local/bin/plex-start.sh
```

```bash
##!/usr/bin/env bash
set -e

export PLEX_MEDIA_SERVER_APPLICATION_SUPPORT_DIR="$HOME/.config/plex"
exec "$HOME/.local/plex/usr/lib/plexmediaserver/Plex Media Server"
```

```bash
chmod +x ~/.local/bin/plex-start.sh
```

Test:

```bash
~/.local/bin/plex-start.sh
```

#### Step 5 – Create a user systemd service

```bash
mkdir -p ~/.config/systemd/user
nano ~/.config/systemd/user/plex.service
```

```ini
[Unit]
Description=Plex Media Server (user install)
After=network-online.target

[Service]
Type=simple
ExecStart=%h/.local/bin/plex-start.sh
Restart=on-failure
RestartSec=5
WorkingDirectory=%h

[Install]
WantedBy=default.target
```

#### Step 6 – Enable and start Plex

```bash
systemctl --user daemon-reload
systemctl --user reset-failed plex
systemctl --user enable --now plex
```

Check:

```bash
systemctl --user status plex --no-pager
```

#### Step 7 – Verify Plex is running

```bash
ss -lntp | grep 32400
```

Open:

```bash
http://localhost:32400/web
```

#### Auto-start behavior

- ✅ Starts automatically in **Desktop Mode**
- ❌ Does not start in Gaming Mode (default)

Optional (advanced):

```bash
loginctl enable-linger deck
```

#### Where everything lives

| Component | Location |
|||
| Plex binaries | `~/.local/plex/` |
| Plex config & database | `~/.config/plex/` |
| Startup script | `~/.local/bin/plex-start.sh` |
| systemd service | `~/.config/systemd/user/plex.service` |
