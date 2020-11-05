from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

import datetime

class Notification(models.Model):
    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    n_type = models.IntegerField()
    title = models.CharField(max_length=50)
    content1 = models.TextField(null=True)
    link_text = models.TextField(null=True)
    link_to = models.TextField(null=True)
    content2 = models.TextField(null=True)

    # Связанные модели
    chat = models.IntegerField(null=True)
    question = models.IntegerField(null=True)
    friend = models.IntegerField(null=True)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True)

    first_name = models.CharField(max_length=30, default="Новый")
    last_name = models.CharField(max_length=30, default="пользователь")
    birth_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=100, default="Не указан")
    cover = models.ImageField(upload_to='images/covers/',
                              default='images/covers/default.png', blank=True)
    reg_date = models.DateTimeField(auto_now_add=True)
    status = models.TextField(max_length=200, default="Статус пуст")

    friends = models.ManyToManyField(User, related_name='friends')
    incoming_friend_requests = models.ManyToManyField(User, related_name='outgoing_friend_requests')

    reputation = models.IntegerField(default=0)
    best_answers = models.IntegerField(default=0)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
