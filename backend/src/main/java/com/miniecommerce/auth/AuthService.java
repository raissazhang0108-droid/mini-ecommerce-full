package com.miniecommerce.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.miniecommerce.common.api.BusinessException;
import com.miniecommerce.security.AuthenticatedUser;
import com.miniecommerce.security.JwtService;
import io.jsonwebtoken.Claims;
import java.time.Duration;
import java.time.Instant;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserMapper users; private final PasswordEncoder encoder; private final JwtService jwt; private final StringRedisTemplate redis;
    public AuthService(UserMapper users,PasswordEncoder encoder,JwtService jwt,StringRedisTemplate redis){this.users=users;this.encoder=encoder;this.jwt=jwt;this.redis=redis;}
    @Transactional public AuthDtos.TokenResponse register(AuthDtos.RegisterRequest req){
        String account=req.account().trim().toLowerCase();
        if(users.selectCount(new LambdaQueryWrapper<UserEntity>().eq(UserEntity::getAccount,account))>0) throw BusinessException.conflict("账号已注册");
        UserEntity u=new UserEntity();u.setAccount(account);u.setPasswordHash(encoder.encode(req.password()));u.setRole("USER");u.setStatus("ACTIVE");users.insert(u);return token(u);
    }
    public AuthDtos.TokenResponse login(AuthDtos.LoginRequest req){
        UserEntity u=users.selectOne(new LambdaQueryWrapper<UserEntity>().eq(UserEntity::getAccount,req.account().trim().toLowerCase()));
        if(u==null||!"ACTIVE".equals(u.getStatus())||!encoder.matches(req.password(),u.getPasswordHash())) throw BusinessException.unauthorized("账号或密码错误");
        return token(u);
    }
    public void logout(String authorization){
        if(authorization==null||!authorization.startsWith("Bearer ")) throw BusinessException.badRequest("缺少 Bearer token");
        Claims c=jwt.parse(authorization.substring(7)); long seconds=Math.max(1,Duration.between(Instant.now(),c.getExpiration().toInstant()).toSeconds());
        redis.opsForValue().set("jwt:blacklist:"+c.getId(),"1",Duration.ofSeconds(seconds));
    }
    public AuthDtos.UserView me(AuthenticatedUser p){return new AuthDtos.UserView(p.id(),p.account(),p.role());}
    private AuthDtos.TokenResponse token(UserEntity u){AuthenticatedUser p=new AuthenticatedUser(u.getId(),u.getAccount(),u.getRole());return new AuthDtos.TokenResponse(jwt.issue(p),"Bearer",jwt.expirationSeconds(),me(p));}
}
