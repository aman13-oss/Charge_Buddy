
package com.chargebuddy.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chargebuddy.entity.Charger;
import com.chargebuddy.repository.ChargerRepository;

@RestController
@RequestMapping("/api/chargers")
@CrossOrigin(origins = "*")
public class ChargerController {

    private final ChargerRepository chargerRepository;

    public ChargerController(ChargerRepository chargerRepository) {
        this.chargerRepository = chargerRepository;
    }

    @GetMapping
    public List<Charger> getAllChargers() {
        return chargerRepository.findAll();
    }

    @PostMapping
    public Charger addCharger(@RequestBody Charger charger) {
        return chargerRepository.save(charger);
    }
}
