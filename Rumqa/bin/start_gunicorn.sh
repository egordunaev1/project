#!/bin/bash
exec gunicorn -c "/home/Rumqa/Rumqa/gunicorn_config.py" Rumqa.wsgi
