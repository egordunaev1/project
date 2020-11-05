import json
from django.conf import settings
from django.contrib.auth.models import User
from rooms.models import Chat, Room, ChatMessage, Message
from rooms.serializers import ChatMessageSerializer
from channels.generic.websocket import WebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync

def get_chat(room):
    return room.chat


def get_room(id):
    return Room.objects.get(pk=id)


def is_user_in_room(user, room):
    return user in room.allowed_users.all() or user in room.admin_list.all()


def save_message(user, chat, data):
    raw_message = data
    message = []

    # Отсеивание пустых блоков
    for i in raw_message:
        if i['type'] == 'text' or i['type'] == 'image':
            if i['value']:
                message += [i, ]
        elif i['type'] == 'code':
            if i['value']['code'] and i['value']['css']:
                message += [i, ]

    # Пустое сообщение
    if not message:
        return ''

    # Создание сообщения
    message = json.dumps(message)
    m = Message(content=message)
    m.save()

    resp = b''  # Тело ответа
    message_data = {
            'chat_message_body': m,
            'chat': chat,
            'sender': user
        }

    cm = ChatMessage(**message_data)
    cm.save()
    resp = ChatMessageSerializer(cm).data
    return resp



class ChatConsumer(WebsocketConsumer):
    def connect(self):
        room_id = int(self.scope['url_route']['kwargs']['room_id'])
        room = get_room(room_id)
        self.chat = get_chat(room)

        chat_name = str(self.chat.id)
        self.chat_group_name = 'chat_%s' % chat_name

        self.user = self.scope['user']
        if room_id == 19 or is_user_in_room(self.user, room):
            # Join room group
            async_to_sync(self.channel_layer.group_add)(
                self.chat_group_name,
                self.channel_name
            )
            self.accept()
        else:
            self.close()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.chat_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        message = save_message(self.user, self.chat, message)
        async_to_sync(self.channel_layer.group_send)(
            self.chat_group_name,
            {
                "type": "chat.message",
                "username": self.user.username,
                "message": message,
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        print(self.user, self.channel_name)
        # prints 3 different users, три различных названия канала, три одинаковых названия группы

        # Send message to WebSocket
        self.send(text_data=json.dumps({
	    'msg_type': settings.MSG_TYPE_MESSAGE,
	    'username': event['username'],
            'message': event['message']
        }))
