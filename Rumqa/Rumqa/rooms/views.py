from django.contrib.auth.models import User
from django.db.models import Q

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import permissions, status

from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_all_lexers
from pygments.styles import get_all_styles, get_style_by_name
from pygments.lexers import Python3Lexer

from Rumqa.settings import NOTIF_ROOM_CHAT_NEW_MESSAGE,\
                            NOTIF_NEW_ANSWER,\
                            NOTIF_BEST_ANSWER

from .models import *
from .serializers import *
import re
import json
import datetime


def path_push(path, add):
    if path.endswith("/"):
        path += add
    else:
        path += "/" + add
    return path

# Получение данных о комнате


@api_view(['GET'])
def room_data(request):
    if request.user.is_authenticated:
        user = request.user
    else:
        user = None

    # Разбиение пути запроса
    path = re.split('/', request.path)
    path.remove('room_data')
    while path.count(''):
        path.remove('')
    if path == ['']:
        return Response(b'', status=status.HTTP_404_NOT_FOUND)
    # Поиск комнаты по пути до нее
    room = Room.objects.get(pk=18)
    for i in path:
        try:
            room = room.nested_rooms.get(name=i)
            if room.id != 19 and not user:
                return Response(b'', status=status.HTTP_401_UNAUTHORIZED)
            if not (room.id == 19 or user in room.allowed_users.all() or user in room.admin_list.all()):
                return Response(b'', status=status.HTTP_403_FORBIDDEN)
        except:
            return Response(b'', status=status.HTTP_404_NOT_FOUND)
    # Сборка ответа
    r = RoomSerializer(room).data
    r['allowed_users'] = StrangerSerializer(room.allowed_users.order_by(
        'profile__last_name', 'profile__first_name'), many=True).data
    r['admin_list'] = StrangerSerializer(room.admin_list.order_by(
        'profile__last_name', 'profile__first_name'), many=True).data
    r['questions'] = room.question_page.questions.count()
    return Response(r, status=status.HTTP_200_OK)


# Получение поверхностной информации о вложенных комнатах
@api_view(['GET'])
def nested_rooms(request, id):
    # Получение информации из запроса
    room = Room.objects.get(pk=id)
    user = request.user

    # Проверка авторизации
    if not user.is_authenticated and room.id != 19:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Проверка доступа
    if not (room.id == 19 or user in room.allowed_users.all() or user in room.admin_list.all()):
        return Response(b'', status=status.HTTP_403_FORBIDDEN)

    # Сборка ответа
    tr = room.nested_rooms.all()
    r = []

    if user in room.admin_list.all():
        for i in list(reversed(range(len(tr)))):
            if (user in tr[i].admin_list.all()) or (user in tr[i].allowed_users.all()) or (tr[i].id == 19):
                r.append(tr[i])

    r = NestedRoomSerializer(r, many=True).data
    # Ответ
    return Response(r, status=status.HTTP_200_OK)


@api_view(['POST'])
def create_Room(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных из запроса
    user = request.user
    data = json.loads(request.body)
    # Если true, то редактируем существуюущую, а не создаем новую
    edit = data['edit']
    members = data['members']  # Пользователи, которых добавили в комнату
    name = data['name'].replace('?', '').replace('/', '')
    description = data['description']
    room = Room.objects.get(pk=data['room'])
    # Проверка доступа
    if not (not edit and room.id == 18 or user in room.admin_list.all()):
        return Response(b'', status=status.HTTP_403_FORBIDDEN)

    if not edit:
        # Создание
        # Комната с таким названием уже есть в текущей комнате
        if room.nested_rooms.filter(name=name):
            return Response({'name': ['Комната с таким названием уже существует']}, status=status.HTTP_400_BAD_REQUEST)
        if room.id == 18 and (name == 'profile' or name == 'chat'):
            return Response({'name': ['Недопустимое имя комнаты']}, status=status.HTTP_400_BAD_REQUEST)

        # Поля будущей комнаты
        data = {
            'name': name,
            'description': description,
            'path': path_push(room.path, name)
        }

        # Проверка полей
        serializer = CreateRoomSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # Создание комнаты
        new_room = Room(**data)
        new_room.nested_in = room
        new_room.save()
        new_room.admin_list.add(user)
        for i in members:
            member = User.objects.get(username=i['username'])
            if i['status'] == 'admin':
                new_room.admin_list.add(member)
            elif i['status'] == 'member':
                new_room.allowed_users.add(member)

        for i in room.admin_list.all():
            new_room.admin_list.add(i)

        # Ответ
        return Response(b'', status=status.HTTP_200_OK)
    else:
        # Редактирование
        # Комната с нужным названием уже есть в комнате родителе
        parent = room.nested_in
        if room.name != name and parent.nested_rooms.filter(name=name):
            return Response({'name': ['Комната с таким названием уже существует']}, status=status.HTTP_400_BAD_REQUEST)

        # Нужные данные
        data = {
            'name': name,
            'description': description,
            'path': path_push(room.nested_in.path, name)
        }

        # Проверка полей
        serializer = CreateRoomSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Редактирование
        room.name = data['name']
        room.description = data['description']
        last_path = room.path
        room.path = data['path']
        room.save()

        # Добавление новых пользователей во все комнаты на пути от корня до текущей
        cur = room
        while cur.id != 18:
            for i in members:
                member = user.profile.friends.get(username=i['username'])
                if i['status'] == 'admin':
                    cur.admin_list.add(member)
                elif i['status'] == 'member':
                    cur.allowed_users.add(member)
            cur = cur.nested_in

        # Изменение пути до всех вложенных в комнат в текущую
        chlds = list(room.nested_rooms.all())
        while chlds:
            chld = chlds.pop()
            p = chld.path
            p = room.path + p[len(last_path):len(p)]
            chld.path = p
            chld.save()
            chlds += list(chld.nested_rooms.all())

        # Ответ
        return Response(room.path, status=status.HTTP_200_OK)


# Загрузка картинки на сервер
@api_view(['POST'])
def upload_image(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение нужных данных
    image = request.FILES['image']
    now_time = str(datetime.datetime.now())
    file_type = re.split(r'\.', image.name).pop()
    allowed_types = ['jpg', 'png', 'gif']

    # Проверка типа картинки
    if not file_type in allowed_types:
        return Response(b'Type error', status=status.HTTP_400_BAD_REQUEST)

    # Загрузка картинки
    image.name = '{}.{}'.format(now_time, file_type)
    img = Image(image=image)
    img.save()

    # Ответ
    return Response(str(img.image), status=status.HTTP_200_OK)


# Получение подчеркнутого кода
@api_view(['POST'])
def upload_code(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных из запроса
    data = json.loads(request.body)
    code = data.get('code')
    lang = data.get('lang')
    style = data.get('style')
    allowed_langs = [
        'python',
        'c',
        'cpp',
        'csharp',
        'java',
        'html',
        'css',
        'php',
        'javascript',
    ]

    # Проверка ЯП
    if not lang in allowed_langs:
        return Response(b'', status=status.HTTP_404_NOT_FOUND)

    # Получение нужных инструментов
    style = get_style_by_name(style)
    lexer = get_lexer_by_name(lang)
    formatter = HtmlFormatter(
        cssclass="source source" + str(data['ind']), style=style)

    # Форматирование
    code = highlight(code, lexer, formatter)
    css = formatter.get_style_defs().replace('source ', '')
    # Ответ
    return Response({
        'code': code,
        'css': css
    },
        status=status.HTTP_202_ACCEPTED
    )


# Отправка сообщения
@api_view(['POST'])
def send_message(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных из запроса
    user = request.user
    data = json.loads(request.body)
    chat = data['chat']
    raw_message = data['struct']
    q_t = data['type']  # Тип сообщения (question, message, answer)
    title = data.get('title', '')
    message = []

    try:
        chat = Chat.objects.get(pk=chat)
    except:
        return Response(b'', status=status.HTTP_404_NOT_FOUND)

    room = chat.room
    # Проверка доступа в комнату
    if room and not (room.id == 19 or user in room.allowed_users.all() or user in room.admin_list.all()):
        return Response(b'', status=status.HTTP_403_FORBIDDEN)

    if not room and user != chat.first_user and user != chat.second_user:
        return Response(b'', status=status.HTTP_403_FORBIDDEN)

    # Отсеивание пустых блоков
    for i in raw_message:
        if i['type'] == 'text' or i['type'] == 'image':
            if i['value']:
                message += [i, ]
        elif i['type'] == 'code':
            if i['value']['code'] and i['value']['css']:
                message += [i, ]

    # Пустое сообщение
    if not message or q_t == 'question' and not title:
        return Response({'error': 'No content'}, status=status.HTTP_400_BAD_REQUEST)

    # Создание сообщения
    message = json.dumps(message)
    m = Message(content=message)
    m.save()

    resp = b''  # Тело ответа

    # Выбор сериализатора
    if q_t == 'message':
        message_data = {
            'chat_message_body': m,
            'chat': chat,
            'sender': user
        }
        cm = ChatMessage(**message_data)
        cm.save()
        resp = ChatMessageSerializer(cm).data
    elif q_t == 'question':
        question_data = {
            'title': title,
            'question_page': room.question_page,
            'creator': user,
            'question_body': m
        }

        Question(**question_data).save()
    elif q_t == 'answer':
        answer_data = {
            'question': Question.objects.get(pk=data['question']),
            'body': m,
            'creator': user
        }
        a = Answer(**answer_data)
        a.save()
        resp = AnswerSerializer(a).data

    # Ответ
    return Response(resp, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_private_chat(request, user_id):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных из запроса
    try:
        user = request.user
        interlocutor = User.objects.get(pk=user_id)
    except:
        return Response(b'', status=status.HTTP_400_BAD_REQUEST)

    # Поиск чата
    chat = Chat.objects.filter(Q(first_user=user, second_user=interlocutor) | Q(
        first_user=interlocutor, second_user=user))
    if len(chat):
        chat = chat[0]
    else:
        chat = Chat(first_user=user, second_user=interlocutor)
        chat.save()

    # Ответ
    return Response(chat.id, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_interlocutor(request, chat_id):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных из запроса
    try:
        user = request.user
        chat = Chat.objects.get(pk=chat_id)
    except:
        return Response(b'', status=status.HTTP_400_BAD_REQUEST)
    if user == chat.first_user:
        interlocutor = chat.second_user
    elif user == chat.second_user:
        interlocutor = chat.first_user
    else:
        return Response(b'', status=status.HTTP_400_BAD_REQUEST)
    return Response(FriendSerializer(interlocutor).data, status=status.HTTP_200_OK)

# Изменение статуса участника комнаты (админ, обычный)


@api_view(['POST'])
def change_status(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных
    user = request.user
    data = json.loads(request.body)
    new_status = data['status']
    username = data['username']
    room = Room.objects.get(pk=int(data['room']))

    if not (user in room.admin_list.all()):
        return Response(b'', status=status.HTTP_403_FORBIDDEN)

    # Смена статуса
    if new_status == 'admin':
        usr = room.allowed_users.get(username=username)
        room.allowed_users.remove(usr)
        room.admin_list.add(usr)
    elif new_status == 'member':
        usr = room.admin_list.get(username=username)
        room.admin_list.remove(usr)
        room.allowed_users.add(usr)
    elif new_status == 'no':
        if room.admin_list.filter(username=username):
            usr = room.admin_list.get(username=username)
            room.admin_list.remove(usr)
            if not room.admin_list.all():
                user = room.allowed_users.all()[0]
                room.allowed_users.remove(user)
                room.admin_list.add(user)
        else:
            usr = room.allowed_users.get(username=username)
            room.allowed_users.remove(usr)
    return Response(b'', status=status.HTTP_200_OK)


# Выбор лучшего ответа
@api_view(['POST'])
def choose_best(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных
    user = request.user
    answer_id = json.loads(request.body)['answer_id']
    try:
        answer = Answer.objects.get(pk=answer_id)
    except:
        return Response(b'', status=status.HTTP_404_NOT_FOUND)
    question = answer.question

    # Проверка доступа
    if question.creator != user or question.best_answer:
        return Response(b'', status=status.HTTP_403_FORBIDDEN)

    # Выбор лучшего ответа
    question.best_answer = answer
    question.save()
    answer.creator.profile.best_answers += 1
    answer.creator.profile.save()

    # Добавление уведомления
    content = {
        'title': f'Ваш ответ выбран лучшим',
        'content1': f'Ваш ответ на вопрос {question.title} в комнате ',
        'link_to': question.question_page.room.path,
        'link_text': question.question_page.room.name,
        'content2': ' выбран лучшим',
        'n_type': NOTIF_BEST_ANSWER,
        'question': question.id,
        'user': user
    }
    for u in Notification.objects.filter(user=user, question=question.id):
        u.delete()
    Notification(**content).save()

    return Response(b'', status=status.HTTP_200_OK)


# API для получения вопросов
@api_view(['GET'])
def get_questions(request):
    # Получение данных из запроса
    user = request.user
    path = request.path.split('/')[1:]
    many = (path[1] == "many")  # Запрос однго вопроса или целой страницы
    if many:
        room = Room.objects.get(pk=int(path[2]))
        page = int(path[3]) - 1
    else:
        room = Room.objects.get(pk=int(path[1]))
        question = int(path[2])

    # Проверка доступа
    if not request.user.is_authenticated and room.id != 19:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Если пользователь, находящийся не в публичной комнате Main, не является участником, ошибка 403
    if not(room.id == 19 or user in room.allowed_users.all() or user in room.admin_list.all()):
        return Response(b'', status=status.HTTP_403_FORBIDDEN)
    if many:
        response = QuestionSerializerWithoutData(room.question_page.questions.all()[
                                                 page*10: page*10 + 10], many=True)
    else:
        try:
            question = room.question_page.questions.get(pk=question)
            response = QuestionSerializer(question)
            if user == question.creator:
                for n in Notification.objects.filter(user=user, n_type=NOTIF_NEW_ANSWER):
                    n.delete()
        except:
            return Response(b'', status=status.HTTP_404_NOT_FOUND)
    return Response(response.data, status=status.HTTP_200_OK)


# Получение сообщений чата
@api_view(['POST'])
def more_messages(request):
    # Получение данных
    data = json.loads(request.body)
    chat = Chat.objects.get(pk=data['chat'])
    last = data['last']
    last_message = data['last_message']
    room = chat.room
    user = request.user

    if room and room.id != 19 and not user:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Проверка доступа
    if room and room.id != 19 and not user in room.admin_list.all() and not user in room.allowed_users.all():
        return Response(b'', status=status.HTTP_403_FORBIDDEN)
    if not room and chat.first_user != user and chat.second_user != user:
        return Response(b'', status=status.HTTP_403_FORBIDDEN)

    ind = 0
    fnd = False
    messages = ChatMessage.objects.filter(chat=chat).order_by('-pk')[:1000]
    for n in Notification.objects.filter(user=user, chat=chat.id):
        n.delete()
    if last_message == -1:
        if last:
            messages = messages[:15]
            fnd = True
        else:
            return Response([], status=status.HTTP_200_OK)
    else:
        for mes in messages:
            if mes.id == last_message:
                if last:
                    messages = messages[ind + 1: ind + 10]
                else:
                    messages = messages[max(ind - 10, 0):ind]
                fnd = True
                break
            ind += 1
    if fnd:
        messages = list(reversed(list(messages)))
        return Response(ChatMessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)
    return Response(b'', status=status.HTTP_404_NOT_FOUND)


# Лайк ответа
@api_view(['POST'])
def like(request):
    # Получение данных
    data = json.loads(request.body)
    user = request.user
    answer = Answer.objects.get(pk=data['answer_id'])

    # Лайк
    if data['l'] == '+':
        dif = 0
        if not user in answer.liked_by.all():
            answer.liked_by.add(user)
            dif += 1
        else:
            answer.liked_by.remove(user)
            dif -= 1
        if user in answer.disliked_by.all():
            answer.disliked_by.remove(user)
            dif += 1
    else:
        dif = 0
        if not user in answer.disliked_by.all():
            answer.disliked_by.add(user)
            dif -= 1
        else:
            answer.disliked_by.remove(user)
            dif += 1
        if user in answer.liked_by.all():
            answer.liked_by.remove(user)
            dif -= 1

    answer.likes += dif
    answer.save()
    return Response(answer.likes, status=status.HTTP_200_OK)
