namespace Platform.Consumer;

/// <summary>
/// Marks an <see cref="GamersCommunity.Core.Services.IBusService"/> that must not be registered
/// for Rabbit bus dispatch (seed / FK catalog only — not exposed on the Gateway).
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class BusInternalAttribute : Attribute;
