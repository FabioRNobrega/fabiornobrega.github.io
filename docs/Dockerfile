FROM ruby:2.7.3

WORKDIR /usr/src/app

RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list \
  && sed -i 's/security.debian.org/archive.debian.org/g' /etc/apt/sources.list \
  && sed -i '/stretch-updates/d' /etc/apt/sources.list

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  nodejs \
  npm \
  libffi-dev \
  && rm -rf /var/lib/apt/lists/*

COPY Gemfile ./

RUN gem install bundler -v 2.3.26

RUN bundle install

COPY . .

EXPOSE 3000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "3000", "--livereload"]
