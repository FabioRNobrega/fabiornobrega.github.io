---
layout: post
comments: false
read_time: Read time of
title:  Welcome to Postgres!
date:   2022-04-16 09:00:00 -0300
categories: postgres
author: Fábio R. Nóbrega
continue: Read more
description: A few introductions on postgres and psql setup for getting things done. 
image: 2022-04-16-welcome-to-postgres.png
---
# Postgres

[PostgreSQL is a powerful, open source object-relational database system that uses and extends the SQL language combined with many features that safely store and scale the most complicated data workloads. The origins of PostgreSQL date back to 1986 as part of the POSTGRES project at the University of California at Berkeley and has more than 30 years of active development on the core platform.
PostgreSQL comes with many features aimed to help developers build applications, administrators to protect data integrity and build fault-tolerant environments, and help you manage your data no matter how big or small the dataset. In addition to being free and open source, PostgreSQL is highly extensible. For example, you can define your own data types, build out custom functions, even write code from different programming languages without recompiling your database!
](https://www.postgresql.org/about/)

So knowing this how we can use Linux? The answer is [ASDF](https://asdf-vm.com) he is one manager for many different languages and CLI, for example, you with him can control your Postgres version for any project one can use postgres 9.1 and others use the 12.0 version. Without any conflict or complication between each other. So for the sake of this article just follow the install documentation for the [Postges ASDF Plugin](https://github.com/smashedtoatoms/asdf-postgres). 

So now after everything setup and up running let's start with the real knowledge.  First, we have to understand that posgres came with psql this is one front-end for prompt interaction between the user and the database. 

> [psql is a terminal-based front-end to PostgreSQL. It enables you to type in queries interactively, issue them to PostgreSQL, and see the query results. Alternatively, input can be from a file or from command line arguments. In addition, psql provides several meta-commands and various shell-like features to facilitate writing scripts and automating a wide variety of tasks](https://www.postgresql.org/docs/12/app-psql.html).

### Login on linux with postgres user

By default when you install postgres the user will be `postgres` and will be without a password. So to log in, just on your linux terminal access 

```bash
sudo -i -u postgres
```

This command will login into postgres user and to access  the psql you will need to access

```bach 
psql
``` 

or just use the following command to access psql directly. 

### Access psql prompt

```bash
sudo -u postgres psql postgres
```

or

```bash
psql  -U  <user-name>
```

So after that, you will be on psql console, which means you can control the database and the postgres configs. As I said before your user doesn't have a password yet. So for that create a password with the following command 

```psql-bash
\password <user-name> 
```

> OBS: The default user is postgress

To enable the password request you need to edit de method of security on

```bash
sudo nano /etc/postgresql/<your-postgres-version>/main/pg_hba.conf
```

Search for `Database administrative login by Unix domain socket` and change `postgres` from `peer` to `md5`. After that when you try to access psql with your user, the system will ask for the password. 

> [The method md5 uses a custom less secure challenge-response mechanism. It prevents password sniffing and avoids storing passwords on the server in plain text but provides no protection if an attacker manages to steal the password hash from the server. Also, the MD5 hash algorithm is nowadays no longer considered secure against determined attacks.](https://www.postgresql.org/docs/12/auth-password.html)


Now if you want to use gpADmin on docker is nice to enable TCP connection beyond localhot for that you need to access: 

```bash
sudo nano /etc/postgresql/<your-postgres-version>/main/postgresql.conf 
```

Search for `CONNECTIONS AND AUTHENTICATION` and dis-comment the line 

```bash
# listen_addresses = 'localhost'          # what IP address(es) to listen on;
```

and change the `'localhost'` to `'*'`. After you change the line will be like: 

```bash
listen_addresses = '*'          # what IP address(es) to listen on;
```

For the postgres to recognize your change you need now to restart him, for that use the command: 

```bash
service postgresql restart
```

or

```
sudo systemctl restart postgresql
```

> This command can be used to update the config file and fix any bug


> Addition of admin extension packs
>
> ```psql-bash
> CREATE EXTENSION adminpack;
> ```
>
> OBS: pack of admin tools



Now to create a new user besides the postgres default one, you can use the command

```bash
sudo -u postgres createuser  -dPs <user-name>
```

> In this command the options were: 
> d - The new user will be allowed to create databases.
> P - If given, createuser will issue a prompt for the password of the new user.
> s - The new user will be a superuser.
>
>
> To know more about creating user options see the [createuser doc](https://www.postgresql.org/docs/12/app-createuser.html).


## Inside psql

Now a few commands for psql 

Get SQL syntax help

```bash
\h
```

Get psql commands

```bash
\? 
```

List all users

```bash
\du
```

List connection info

```bash
\conninfo
```

Inside psql as said before is a front-end admin for postgres which means he also can run SQL. And that is another history but he is a few ideas: 


Create database: 

```sql
CREATE DATABASE <db-name>;
```

Create Table: 
```sql
CREATE TABLE public."<table-name>"
(
    id serial NOT NULL,
    name "char" NOT NULL,
    PRIMARY KEY (id)
);

```

Change access for other users 
```sql
GRANT ALL ON DATABASE  <db-name> TO <user-name>; 
```

So that all folks, any questions just [get in touch](https://fabiornobrega.github.io/contact/)
