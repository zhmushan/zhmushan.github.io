import MarkdownIt from "markdown-it";

export const md = new MarkdownIt();

interface ContentOfTable {
  id: string;
  title: string;
  path: string;
}

export const blog: ContentOfTable[] = [
  {
    id: "blog_a_md",
    title: "A",
    path: "static/blog/a.md",
  },
];

export const aboutMe: ContentOfTable[] = [
  {
    id: "about_me_welcome_md",
    title: "Welcome",
    path: "static/about_me/welcome.md",
  },
  {
    id: "about_me_projects_md",
    title: "Projects",
    path: "static/about_me/projects.md",
  },
];
