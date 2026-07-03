package com.example.demo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component //annotation danh dau class la Spring Bean
public class JwtUtil {

    @Value("${jwt.secret}") //Lay gia tri tu file properties
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private SecretKey getSigningKey() { //Tao khoa bi mat, key phai o dang SecretKey (not String)
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        // Lap rap JWT
        // Cau truc JWT gom 3 phan noi voi nhau: Header(thuat_toan).payload(claims).signature(chu_ky)
        return Jwts.builder()
                .setClaims(extraClaims) // payload: { role: "ROLE_USER" }
                .setSubject(userDetails.getUsername()) // subject: email của user
                .setIssuedAt(new Date(System.currentTimeMillis())) // iat: thời điểm tạo token
                .setExpiration(new Date(System.currentTimeMillis() + expiration)) // exp: thời điểm hết hạn
                .signWith(getSigningKey()) // ký bằng secret key
                .compact(); //xuat ra dang String
    }

    public String generateToken(UserDetails userDetails) {  //Tao access token
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", userDetails.getAuthorities()
                .stream().findFirst()
                .map(GrantedAuthority::getAuthority).orElse("ROLE_USER"));
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public String generateRefreshToken(UserDetails userDetails) {  //Tao refresh token
        return buildToken(new HashMap<>(), userDetails, refreshExpiration);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {  //Giai ma token
        return Jwts.parserBuilder()  //dung cai nay thay cho parser() -> loi thoi
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();  //Lay payload (claims)
    }
}
