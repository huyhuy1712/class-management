package com.classmanagement.backend.service;

import com.classmanagement.backend.dto.publiclookup.PublicStudentLookupResponse;

public interface PublicLookupService {

    PublicStudentLookupResponse lookupStudentByCode(String code);
}

