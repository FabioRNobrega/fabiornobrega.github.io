# My Jekyll site 

This project is my personal website, developed with [jekyll](https://jekyllrb.com/).

> Last stable configuration:  `ruby 2.7.3` | `gem 3.3.2`

Table of Contents
=================

  * [Install](#install)
  * [Usage](#usage)
  * [Docker](#docker)
  * [Git Guidelines](#git-guidelines)

## Install

+ Clone the repo and cd into the docs folder

```bash
$ bundle install
```

## Usage (local without docker)

```bash 
$ bundle exec jekyll serve
```

The application will be available at:

```
http://localhost:3000/
```

## Docker

This project can also be executed using **Docker** to avoid dependency issues.

### Run the container

```bash
make docker-run
```

### Run in background

```bash
make docker-run-detached
```

### Stop the container

```bash
make docker-down
```

### Rebuild the image

```bash
make docker-rebuild
```

The site will be available at:

```
http://localhost:3000/
```

## Git Guidelines

Create your branches and commits in English following the rules below: 

#### Branches
- Feature:  `feat/branch-name`
- Hotfix: `hotfix/branch-name`
- POC: `poc/branch-name`

#### Commit prefixes
- Chore: `chore(context): message`
- Feat: `feat(context): message`
- Fix: `fix(context): message`
- Refactor: `refactor(context): message`
- Tests: `tests(context): message`
- Docs: `docs(context): message`

#### Opening PR's

When opening a PR, please follow our template.
