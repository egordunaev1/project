from rest_framework import viewsets
from django.http import HttpResponseRedirect
from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, viewsets
from .serializers import *
from rooms.serializers import NestedRoomSerializer
from .models import Profile, Notification
from rooms.models import Room
from .forms import UploadFileForm
from django.conf import settings
from django.core.files.storage import default_storage
from django.utils.translation import ugettext_lazy as _

from Rumqa.settings import NOTIF_FRIEND_ACCEPT,\
    NOTIF_FRIEND_DELETE,\
    NOTIF_FRIEND_DENY,\
    NOTIF_FRIEND_REQUEST

import datetime
import json
import re


# Изменение профиля
@api_view(['PUT'])
def profile_edit(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    # Получение данных из запроса
    user = request.user
    cover = request.FILES.get('cover', user.profile.cover)
    cover_has_uploaded = bool(request.FILES.get('cover', False))
    first_name = request.POST.get('first_name', user.profile.first_name)
    last_name = request.POST.get('last_name', user.profile.last_name)
    about = request.POST.get('status', user.profile.status)
    location = request.POST.get('location', user.profile.location)
    birth_date = request.POST.get('birth_date', user.profile.birth_date)
    if birth_date == '':
        birth_date = user.profile.birth_date

    # Проверка имени
    fn_val = re.match(r'[A-ZА-Я]{1}[a-zа-я]{,29}', first_name)
    fn_err = False
    if not fn_val or fn_val.group(0) != first_name:
        fn_err = True
    else:
        user.profile.first_name = first_name

    # Проверка фамилии
    ln_val = re.match(r'[A-ZА-Я]{1}[a-zа-я]{,29}', last_name)
    ln_err = False
    if not ln_val or ln_val.group(0) != last_name:
        ln_err = True
    else:
        user.profile.last_name = last_name

    # Проверка имени
    ab_val = re.match(r'[A-Za-zА-Яа-я.?!,():; ]{,200}', about)
    ab_err = False
    if not ab_val or ab_val.group(0) != about:
        ab_err = True
    else:
        user.profile.status = about

    # Проверка города
    loc_val = re.match(r'[A-ZА-Я]{1}[a-zа-я]{,29}', location)
    loc_err = False
    if not loc_val or loc_val.group(0) != location:
        loc_err = True
    else:
        user.profile.location = location

    # Загрузка фотографии
    if cover_has_uploaded:
        now_time = str(datetime.datetime.now())
        file_type = re.split(r'\.', cover.name).pop()
        cover.name = '{}.{}'.format(now_time, file_type)

    user.profile.birth_date = birth_date
    user.profile.cover = cover

    user.save()

    data = {
        'first_name': fn_err,
        'last_name': ln_err,
        'status': ab_err,
        'location': loc_err
    }

    return Response(data, status=status.HTTP_202_ACCEPTED)


# Поиск по списку друзей
@api_view(['POST'])
def search_friends(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    if request.body:
        data = json.loads(request.body)
    try:
        room = data.get('room', None)
        data = data['search']
    except:
        return Response(b'', status=status.HTTP_400_BAD_REQUEST)

    if len(data) > 60:
        return Response(b'', status=status.HTTP_400_BAD_REQUEST)

    # Получение данных из запроса
    data_split = re.split(r' ', data)
    for i in range(data_split.count('')):
        data_split.remove('')
    user = request.user
    result_friends = []
    result_not_friends = []

    # Если идет поиск при создании/редактировании некорневой комнаты
    if room and room != 18:
        room = Room.objects.get(pk=room)
        # Поиск совпадений среди всех пользователей
        if len(data_split):
            for friend in room.allowed_users.all():
                if user == friend:
                    continue
                res = 0

                search = list(reversed(sorted([x.upper()
                                               for x in data_split], key=len)))
                data = list(reversed(sorted([friend.profile.first_name.upper(
                ), friend.profile.last_name.upper(), friend.username.upper()])))

                for i in search:
                    for j in data:
                        if j and i and re.search(i, j):
                            res += len(i)*100 - (len(j) - len(i))
                            data.remove(j)
                            break
                if res:
                    result_not_friends += [(res,
                                            FriendSerializer(friend).data)]
        else:
            result_not_friends = [(0, FriendSerializer(i).data)
                                  for i in room.allowed_users.all()]

        result = {
            'friends': [i[1] for i in reversed(sorted(result_not_friends, key=lambda x: x[0]))]
        }
        return Response(result, status=status.HTTP_200_OK)

    # Поиск совпадений среди друзей
    for friend in user.profile.friends.all():
        res = 0
        search = list(reversed(sorted([x.upper()
                                       for x in data_split], key=len)))
        data = list(reversed(sorted([friend.profile.first_name.upper(
        ), friend.profile.last_name.upper(), friend.username.upper()])))
        for i in search:
            for j in data:
                if j and i and re.search(i, j):
                    res += len(i)*100 - (len(j) - len(i))
                    data.remove(j)
                    break
        if res:
            result_friends += [(res, FriendSerializer(friend).data)]

    # Поиск совпадений среди всех пользователей
    for friend in User.objects.all():
        if user.profile in friend.friends.all() or user == friend:
            continue
        res = 0

        search = list(reversed(sorted([x.upper()
                                       for x in data_split], key=len)))
        data = list(reversed(sorted([friend.profile.first_name.upper(
        ), friend.profile.last_name.upper(), friend.username.upper()])))

        for i in search:
            for j in data:
                if j and i and re.search(i, j):
                    res += len(i)*100 - (len(j) - len(i))
                    data.remove(j)
                    break
        if res:
            result_not_friends += [(res, FriendSerializer(friend).data)]

    result = {
        'friends': [i[1] for i in reversed(sorted(result_friends, key=lambda x: x[0]))],
        'not_friends': [i[1] for i in reversed(sorted(result_not_friends, key=lambda x: x[0]))]
    }

    return Response(result, status=status.HTTP_200_OK)


# Структуризация комнат по вложенности
def structure_rooms(rooms):
    rooms.sort(key=lambda r: r['id'])
    rooms.reverse()
    m = {}
    for i in range(len(rooms)):
        m[rooms[i]['id']] = i
        rooms[i]['nested_rooms'] = []
    r = []
    for i in rooms:
        if m.get(i['nested_in'], False):
            rooms[m[i['nested_in']]]['nested_rooms'].append(i)
        else:
            r.append(i)
    return r


# Получение комнат пользователя
@api_view(['GET'])
def my_rooms(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)
    main = NestedRoomSerializer(Room.objects.get(pk=19)).data
    main['nested_rooms'] = []
    response = [main]
    response += structure_rooms(NestedRoomSerializer(
        request.user.allowed_rooms, many=True).data)
    response += structure_rooms(NestedRoomSerializer(
        request.user.admin_in, many=True).data)
    return Response(response, status=status.HTTP_200_OK)


# Получение данных о текущем пользователе, используя токен
@api_view(['GET'])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# Получение данных о пользователе
@api_view(['GET'])
def user_data(request, id):
    try:
        user = User.objects.get(pk=id)
        response = {'rel': 'stranger'}

        if not request.user.is_authenticated or request.user == user:
            response['rel'] = 'none'
        elif user.profile.incoming_friend_requests.filter(username=request.user.username):
            response['rel'] = 'friend_out'
        elif request.user.profile.incoming_friend_requests.filter(username=user.username):
            response['rel'] = 'friend_inc'
        elif user.profile.friends.filter(username=request.user.username):
            response['rel'] = 'friend'
        else:
            response['rel'] = 'stranger'
        serializer = StrangerSerializer(user)
        response.update(serializer.data)
        return Response(response, status=status.HTTP_200_OK)
    except:
        return Response(b'', status=status.HTTP_404_NOT_FOUND)


# Обновление списка друзей
@api_view(['POST'])
def update_friend_list(request, id):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)

    data = dict()
    if request.body:
        data = json.loads(request.body)['data']

    user = request.user
    try:
        friend = User.objects.get(pk=id)
    except:
        return Response(b'', status=status.HTTP_400_BAD_REQUEST)
    if user == friend:
        return Response(b'', status=status.HTTP_400_BAD_REQUEST)
    if friend.profile in user.friends.all():
        if data.get('request', False):
            if data['request'] == 'remove':
                user.friends.remove(friend.profile)
                friend.friends.remove(user.profile)
                user.save()
                friend.save()
                content = {
                    'title': f'Вас удалили из друзей',
                    'link_to': f'/profile/{user.id}',
                    'content1': 'Пользователь ',
                    'link_text': user.username,
                    'content2': ' удалил вас из друзей',
                    'n_type': NOTIF_FRIEND_DELETE,
                    'friend': user.id,
                    'user': friend
                }
                Notification(**content).save()
                for u in Notification.objects.filter(user=user, friend=friend.id):
                    u.delete()
                for u in Notification.objects.filter(user=friend, friend=user.id):
                    u.delete()
                return Response(b'', status=status.HTTP_202_ACCEPTED)
            return Response(b'', status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(b'', status=status.HTTP_400_BAD_REQUEST)

    if user.profile in friend.outgoing_friend_requests.all():
        if data.get('request', False):
            if data['request'] == 'accept':
                friend.outgoing_friend_requests.remove(user.profile)
                friend.friends.add(user.profile)
                user.friends.add(friend.profile)
                user.save()
                friend.save()
                content = {
                    'title': f'Запрос в друзья принят',
                    'content1': f'Пользователь ',
                    'link_to': f'/profile/{user.id}',
                    'link_text': user.username,
                    'content2': ' принял ваш запрос в друзья',
                    'n_type': NOTIF_FRIEND_ACCEPT,
                    'friend': user.id,
                    'user': friend
                }
                for u in Notification.objects.filter(user=user, friend=friend.id):
                    u.delete()
                Notification(**content).save()
            elif data['request'] == 'deny':
                friend.outgoing_friend_requests.remove(user.profile)
                friend.save()
                content = {
                    'title': f'Запрос в друзья отклонен',
                    'content1': f'Пользователь ',
                    'link_to': f'/profile/{user.id}',
                    'link_text': user.username,
                    'content2': ' отклонил ваш запрос в друзья',
                    'n_type': NOTIF_FRIEND_DENY,
                    'friend': user.id,
                    'user': friend
                }
                for u in Notification.objects.filter(friend=friend.id, user=user):
                    u.delete()
                Notification(**content).save()
            else:
                return Response(b'', status=status.HTTP_400_BAD_REQUEST)
            return Response(b'', status=status.HTTP_202_ACCEPTED)
        else:
            return Response(b'', status=status.HTTP_400_BAD_REQUEST)
    else:
        if friend.profile in user.outgoing_friend_requests.all():
            return Response(b'', status=status.HTTP_304_NOT_MODIFIED)
        else:
            user.outgoing_friend_requests.add(friend.profile)
            user.save()
            content = {
                    'title': f'Новый запрос в друзья',
                    'content1': 'Пользователь ',
                    'link_text': user.username,
                    'link_to': f'/profile/{user.id}',
                    'content2': ' отправил вам запрос в друзья',
                    'n_type': NOTIF_FRIEND_REQUEST,
                    'friend': user.id,
                    'user': friend
                }
            Notification(**content).save()
            return Response(b'', status=status.HTTP_202_ACCEPTED)


# Создание пользователя
@api_view(['POST'])
def create_user(request):
    data = request.data
    username = data.get('username', '')
    password = data.get('password', '')
    repeat_password = data.get('repeat_password', '')

    errors = {'username': '', 'password': ''}
    if User.objects.filter(username=data['username']).exists():
        errors['username'] = 'Логин уже существует'
    elif len(username) < 8 or len(username) > 32:
        errors['username'] = 'Логин должен быть от 8 до 32 символов'
    elif len(re.match(r'[A-Za-z0-9._-]+', username).group(0)) != len(username):
        errors['username'] = 'Логин должен содержать символы латинского алфавита, цифры или символы ".", "_", "-"'

    if password == '':
        errors['password'] = 'Введите пароль'
    elif repeat_password == '':
        errors['password'] = 'Повторите пароль'
    elif repeat_password != password:
        errors['password'] = 'Пароли не совпадают'
    elif len(password) < 8 or len(password) > 32:
        errors['password'] = 'Пароль должен быть не короче 8 символов'
    elif len(re.match(r'[A-Za-z0-9._-]+', password).group(0)) != len(password):
        errors['password'] = 'Пароль должен содержать символы латинского алфавита, цифры или знаки ".", "_", "-"'

    serializer = UserSerializerWithToken(data=data)
    if not errors['username'] and not errors['password'] and serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_notifications(request):
    if not request.user.is_authenticated:
        return Response(b'', status=status.HTTP_401_UNAUTHORIZED)
    user = request.user

    # Получение уведомлений
    notifications = Notification.objects.filter(user=user).order_by('-pk')
    for n in notifications[20:]:
        n.delete()
    serializer = NotificationSerializer(notifications, many=True)

    # Ответ
    return Response(serializer.data, status=status.HTTP_200_OK)
