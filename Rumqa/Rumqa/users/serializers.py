from rest_framework import serializers
from rest_framework_jwt.settings import api_settings

from django.contrib.auth.models import User

from .models import Profile, Notification


# ----------------------- NotificationSerializer -------------------------- #

class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification
        fields = ('id', 'title', 'content1', 'link_to', 'link_text', 'content2')

# -------------------------- FriendSerilizers ----------------------------- #

class FriendProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Profile
        fields = ('id', 'first_name', 'last_name', 'cover', 'status')


class FriendSerializer(serializers.ModelSerializer):
    profile = FriendProfileSerializer()

    class Meta:
        model = User
        fields = ('id', 'username', 'profile')

# ------------------------ StrangerSerilizers ----------------------------- #


class StrangerProfileSerializer(serializers.ModelSerializer):
    friends = FriendSerializer(many=True)

    class Meta:
        model = Profile
        fields = ('first_name', 'last_name', 'birth_date',
                  'location', 'cover', 'reg_date', 'status',
                  'friends', 'reputation', 'best_answers')


class StrangerSerializer(serializers.ModelSerializer):
    profile = StrangerProfileSerializer()

    class Meta:
        model = User
        fields = ('id', 'username', 'profile')

# -------------------------- UserSerilizers ----------------------------- #


class ProfileSerializer(serializers.ModelSerializer):
    friends = FriendSerializer(many=True, read_only=True)
    incoming_friend_requests = FriendSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = ('first_name', 'last_name', 'birth_date',
                  'location', 'cover', 'reg_date', 'status',
                  'friends',  'incoming_friend_requests',
                  'reputation', 'best_answers')

        read_only_fields = ('reg_date', 'incoming_friend_requests',
                            'friends', 'reputation', 'best_answers')


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'profile')


class UserSerializerWithToken(serializers.ModelSerializer):

    token = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True)

    def get_token(self, obj):
        jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
        jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER

        payload = jwt_payload_handler(obj)
        token = jwt_encode_handler(payload)
        return token

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    class Meta:
        model = User
        fields = ('token', 'username', 'password')
