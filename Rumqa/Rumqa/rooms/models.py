from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from Rumqa.settings import NOTIF_PRIVATE_CHAT_NEW_MESSAGE,\
                           NOTIF_ROOM_CHAT_NEW_MESSAGE,\
                           NOTIF_NEW_ANSWER
from users.models import Notification


def delete_same_notifs(user, filtr):
    for n in user.notifications.filter(**filtr):
        n.delete()

#<------------------------------ Base Models ------------------------------>#


class Image(models.Model):
    image = models.ImageField(upload_to='images/message_images/')


class Message(models.Model):
    content = models.TextField()


class Room(models.Model):
    name = models.CharField(max_length=50)
    nested_in = models.ForeignKey(
        'Room', on_delete=models.CASCADE, related_name='nested_rooms', null=True, blank=True)
    allowed_users = models.ManyToManyField(
        User, related_name='allowed_rooms', blank=True)
    admin_list = models.ManyToManyField(
        User, related_name='admin_in', blank=True)
    description = models.TextField(default='')
    path = models.TextField()

    def __str__(self):
        return self.name


@receiver(post_save, sender=Room)
def create_room(sender, instance, created, **kwargs):
    if created:
        Chat.objects.create(room=instance)
        QuestionPage.objects.create(room=instance)


@receiver(post_save, sender=Room)
def save_room(sender, instance, **kwargs):
    instance.chat.save()
    instance.question_page.save()


#<---------------------------------- Chat --------------------------------->#

class ChatMessage(models.Model):
    chat_message_body = models.OneToOneField(
        'Message', on_delete=models.CASCADE)
    chat = models.ForeignKey(
        'Chat', on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True)

@receiver(post_save, sender=ChatMessage)
def create_chatmessage(sender, instance, created, **kwargs):
    if created:
        chat = instance.chat
        room = chat.room
        if room:
            link_to = room.path
        else:
            link_to = f'/chat/{chat.id}'
        content = {
            'title': f'Новое сообщение',
            'content1': f'В чате ',
            'link_to': link_to,
            'link_text': f'{chat.first_user}-{chat.second_user}',
            'content2': ' есть новые сообщения',
            'n_type': NOTIF_ROOM_CHAT_NEW_MESSAGE,
            'chat': chat.id,
        }
        if not room:
            content['n_type'] = NOTIF_PRIVATE_CHAT_NEW_MESSAGE
            if chat.first_user.id != instance.sender.id:
                delete_same_notifs(chat.first_user, {'chat': chat.id})
                Notification(user=chat.first_user, **content).save()
            else:
                delete_same_notifs(chat.second_user, {'chat': chat.id})
                Notification(user=chat.second_user, **content).save()
        else:
            for user in room.admin_list.all():
                if user.id != instance.sender.id:
                    delete_same_notifs(user, {'chat': chat.id})
                    Notification(user=user, **content).save()
            for user in room.allowed_users.all():
                if user.id != instance.sender.id:
                    delete_same_notifs(user, {'chat': chat.id})
                    Notification(user=user, **content).save()


class Chat(models.Model):
    room = models.OneToOneField(
        'Room', on_delete=models.CASCADE, related_name='chat', null=True, blank=True)
    first_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="chats_f", null=True)
    second_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="chats_s", null=True)


#<----------------------------- Question Page ----------------------------->#


class Answer(models.Model):
    question = models.ForeignKey(
        'Question', on_delete=models.CASCADE, related_name='answers')
    body = models.OneToOneField('Message', on_delete=models.CASCADE)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    likes = models.IntegerField(default=0)
    liked_by = models.ManyToManyField(User, related_name='liked_answers')
    disliked_by = models.ManyToManyField(User, related_name='disliked_answers')

@receiver(post_save, sender=Answer)
def create_answer(sender, instance, created, **kwargs):
    if created:
        question = instance.question
        room = question.question_page.room
        user = question.creator
        content = {
            'title': f'Новый ответ на вопрос',
            'content1': f'На ваш вопрос {question.title} в комнате ',
            'link_to': f"/{room.path}",
            'link_text': room.name,
            'content2': ' есть новые сообщения',
            'n_type': NOTIF_NEW_ANSWER,
            'question': question.id,
            'user': user
        }
        delete_same_notifs(user, {'question': question.id})
        Notification(**content).save()


class Question(models.Model):
    question_page = models.ForeignKey(
        'QuestionPage', on_delete=models.CASCADE, related_name='questions')
    title = models.CharField(max_length=150)
    question_body = models.OneToOneField(
        'Message', on_delete=models.CASCADE, related_name='question')
    best_answer = models.OneToOneField(
        'Answer', on_delete=models.CASCADE, blank=True, null=True, related_name='best_in')
    creator = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ["-pk"]


class QuestionPage(models.Model):
    room = models.OneToOneField(
        'Room', on_delete=models.CASCADE, related_name='question_page')

#<------------------------------- Task Page ------------------------------->#


class Task(models.Model):
    task_page = models.ForeignKey(
        'TaskPage', on_delete=models.CASCADE, related_name='tasks')
    body = models.OneToOneField('Message', on_delete=models.CASCADE)
    performer_list = models.ManyToManyField(User, related_name='task_list')
    is_completed = models.BooleanField(default=False)


class TaskPage(models.Model):
    room = models.OneToOneField(
        'Room', on_delete=models.CASCADE, related_name='task_page')
