package com.example.demo.service;

import com.example.demo.dto.response.FavouriteVocabResponse;
import java.util.List;

public interface FavouriteVocabService {

    void addFavourite(Long userId, Long vocabId);

    void removeFavourite(Long userId, Long vocabId);

    List<FavouriteVocabResponse> getFavourites(Long userId);

    boolean isFavourite(Long userId, Long vocabId);

}
