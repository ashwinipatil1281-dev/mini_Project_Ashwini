
package com.givetrack.servlet;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
                          throws ServletException, IOException {

        String email = request.getParameter("email");
        String password = request.getParameter("password");

        response.setContentType("text/html;charset=UTF-8");

        if (email == null || email.trim().isEmpty()
                || password == null || password.isEmpty()) {

            response.getWriter().println(
                "<h3>Please enter email and password.</h3>"
            );
            return;
        }

        response.getWriter().println(
            "<h3>Login request received successfully.</h3>"
        );

        // Actual authentication will be implemented
        // using the shared GiveTrack database.
    }
}
