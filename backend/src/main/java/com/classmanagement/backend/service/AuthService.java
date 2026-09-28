package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.auth.SignupRequest;
import com.classmanagement.backend.dto.auth.SignupResponse;
import com.classmanagement.backend.dto.auth.LoginRequest;
import com.classmanagement.backend.dto.auth.LoginResponse;

public interface AuthService {

    SignupResponse signup(SignupRequest request);
    LoginResponse login(LoginRequest request);

}