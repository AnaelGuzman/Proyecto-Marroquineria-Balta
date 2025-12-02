package com.marroquineriabalta.repository;

import com.marroquineriabalta.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String> {

    Optional<Usuario> findByCorreoElectronico(String correoElectronico);

    boolean existsByCorreoElectronico(String correoElectronico);

    // ✅ AGREGA ESTE MÉTODO
    boolean existsByRut(String rut);
}