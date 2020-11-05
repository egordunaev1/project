from rest_framework import serializers

from django.contrib.auth.models import User

from . import models
from users.serializers import FriendSerializer, StrangerSerializer, UserSerializer


#<------------------------------ Base Models ------------------------------>#

class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Room
        fields = ('name', 'path', 'description')

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Message
        fields = ('content',)

class NestedRoomSerializer(serializers.ModelSerializer):
    allowed_users = StrangerSerializer(many=True)
    admin_list = StrangerSerializer(many=True)
    class Meta:
        model = models.Room
        fields = ('id', 'name', 'path', 'allowed_users', 'admin_list', 'description', 'nested_in')


#<---------------------------------- Chat --------------------------------->#

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = FriendSerializer()
    chat_message_body = MessageSerializer()
    class Meta:
        model = models.ChatMessage
        fields = ('id', 'chat_message_body', 'chat', 'sender')

class ChatSerializer(serializers.ModelSerializer):
    chat_messages = ChatMessageSerializer(many=True)
    class Meta:
        model = models.Chat
        fields = ('id', 'chat_messages', 'room')
        read_only_fields = ('chat_messages',)

#<----------------------------- Question Page ----------------------------->#

class AnswerSerializer(serializers.ModelSerializer):
    body = MessageSerializer()
    creator = FriendSerializer()
    class Meta:
        model = models.Answer
        fields = ('id', 'body', 'question', 'creator', 'likes')

class QuestionSerializerWithoutData(serializers.ModelSerializer):
    creator = FriendSerializer()
    class Meta:
        model = models.Question
        fields = ('id', 'title', 'creator')

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)
    question_body = MessageSerializer()
    creator = FriendSerializer()
    class Meta:
        model = models.Question
        fields = ('id', 'title', 'question_body', 'answers', 'best_answer', 'question_page', 'creator')

class QuestionPageSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    class Meta:
        model = models.QuestionPage
        fields = ('questions', 'room')

#<------------------------------- Task Page ------------------------------->#

class TaskSerializer(serializers.ModelSerializer):
    body = MessageSerializer()
    class Meta:
        model = models.Task
        fields = ('body', 'performer_list', 'is_completed', 'task_page')

class TaskPageSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True)
    class Meta:
        model = models.TaskPage
        fields = ('tasks', 'room',)
        read_only_fields = ('tasks',)

#<------------------------------- Task Page ------------------------------->#

class RoomSerializer(serializers.ModelSerializer):
    allowed_users = StrangerSerializer(many=True)
    admin_list = StrangerSerializer(many=True)
    chat = ChatSerializer()

    class Meta:
        model = models.Room
        fields = ('id', 'path', 'name', 'nested_in', 'chat', 'task_page', 'question_page', 'allowed_users', 'admin_list', 'description')
