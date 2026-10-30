using System.Runtime.Versioning;
using Microsoft.Extensions.Hosting.WindowsServices;
using VNC.LocalAgent.Service;

[assembly: SupportedOSPlatform("windows")]

var builder = Host.CreateApplicationBuilder(args);

// Configure as a real Windows Service
builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "VNC-Local-Agent";
});

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
