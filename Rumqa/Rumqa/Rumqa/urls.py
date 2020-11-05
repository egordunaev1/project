from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_jwt.views import obtain_jwt_token

from users.views import *
from rooms.views import *
from django.urls import path, re_path

from django.conf.urls.static import static
from django.conf import settings


router = DefaultRouter()

#router.register(r'rooms', RoomViewSet, basename='room')
#router.register(r'taskpages', TaskPageViewSet, basename='taskpage')
#router.register(r'questionpages', QuestionPageViewSet, basename='questionpage')
#router.register(r'chats', ChatViewSet, basename='chat')


urlpatterns = [
    re_path(r'^search_friends/$', search_friends),
    re_path(r'^profile_edit/$', profile_edit),
    re_path(r'^update_friend_list/(?P<id>\d+)/$', update_friend_list),
    re_path(r'^create_user/$', create_user),
    re_path(r'^user_data/(?P<id>\d+)/$', user_data),
    re_path(r'^room_data/', room_data),
    re_path(r'^nested_rooms/(?P<id>\d+)/', nested_rooms),
    re_path(r'^private_chat/(?P<user_id>\d+)/$', get_private_chat),
    re_path(r'^get_questions/', get_questions),
    re_path(r'^create_room/$', create_Room),
    re_path(r'^upload_image/$', upload_image),
    re_path(r'^upload_code/$', upload_code),
    re_path(r'^send_message/$', send_message),
    re_path(r'^change_status/$', change_status),
    re_path(r'^interlocutor/(?P<chat_id>\d+)$', get_interlocutor),
    re_path(r'^choose_best/$', choose_best),
    re_path(r'^more_messages/$', more_messages),
    re_path(r'^my_rooms/$', my_rooms),
    re_path(r'^notifications/$', get_notifications),
    re_path(r'^like/$', like),
    re_path(r'^token-auth/$', obtain_jwt_token),
    re_path(r'^current-user/$', current_user),
    re_path(r'^admin/', admin.site.urls),
    re_path(r'^api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)