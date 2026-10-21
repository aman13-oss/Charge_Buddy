
package com.chargebuddy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chargebuddy.entity.Charger;

@Repository
public interface ChargerRepository extends JpaRepository<Charger, Long> {
}
