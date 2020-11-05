from django.contrib import admin
from users.models import Profile
from rooms.models import Room, Question, QuestionPage, Answer

admin.site.register(Profile)
admin.site.register(Room)
admin.site.register(Question)
admin.site.register(Answer)