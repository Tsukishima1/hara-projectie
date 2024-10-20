"use client";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DottedSeparator } from "@/components/dotted-seperator";
import { Button } from "@/components/ui/button";
import {
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().trim().min(1,"Required"),
  email: z.string().email(),
  password: z.string().min(8,"Minimum of 8 characters"),
})

export const SignUpCard = () => {
  const form= useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // TODO: Handle form submission
    console.log(values)
  }

  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">
          Sign Up
        </CardTitle>
        <CardDescription>
          By signing up, you agree to our {" "}
          <Link href="/privacy">
            <span className="text-violet-600 underline-offset-auto underline">Privacy Policy</span>
          </Link>{" "}and{" "}
          <Link href="/terms">
            <span className="text-violet-600 underline-offset-auto underline">Terms of Service</span>
          </Link>
        </CardDescription>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            name="name"
            control={form.control}
            render={({ field })=>(
              <FormItem>
                <FormControl>
                  <Input 
                    {...field}
                    type="text" 
                    placeholder="Enter your name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="email"
            control={form.control}
            render={({ field })=>(
              <FormItem>
                <FormControl>
                  <Input 
                    {...field}
                    type="email" 
                    placeholder="Enter your email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={form.control}
            render={({ field })=>(
              <FormItem>
                <FormControl>
                  <Input 
                    {...field}
                    type="password" 
                    placeholder="Enter your password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button size={"lg"} className="w-full">
            Login
          </Button>
        </form>
      </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex flex-col gap-y-4">
        <Button variant={"secondary"} size={"lg"} className="w-full">
          <FcGoogle style={{width:"1.3rem",height:"1.3rem"}}/>
          Login with Google
        </Button>
        <Button variant={"secondary"} size={"lg"} className="w-full">
          <FaGithub style={{width:"1.3rem",height:"1.3rem"}}/>
          Login with Github
        </Button>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <div className="text-center">
          Already have an account? {" "}
          <Link href="/sign-in">
            <span className="text-violet-600 underline-offset-auto underline">Sign In</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

