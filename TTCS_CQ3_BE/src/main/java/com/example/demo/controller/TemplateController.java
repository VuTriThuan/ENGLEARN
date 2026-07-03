package com.example.demo.controller;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    @GetMapping("/vocab-import.csv")
    public ResponseEntity<Resource> downloadVocabImportTemplate() {
        String csvContent = "Word,Pronunciation,Type,Meaning,Level,Example,Topic,Lesson\n" +
                "Sightseeing,/ˈsaɪtˌsiː.ɪŋ/,Danh từ,Sự tham quan,A2,We did a bit of sightseeing in London,Travel,London Trip\n" +
                "Apple,/ˈæp.l/,Danh từ,Quả táo,A1,I eat an apple every day,,";

        byte[] data = csvContent.getBytes(StandardCharsets.UTF_8);
        ByteArrayResource resource = new ByteArrayResource(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"vocab-import-template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(data.length)
                .body(resource);
    }
}
